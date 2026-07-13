import {
	applyTemplate,
	dataNodeTemplate,
	dataNodeTemplates,
	mergeSilentValues,
	templateFieldDefault,
	validateTemplateValue
} from '../data-node-templates';

const itemReward = dataNodeTemplate('item-reward')!;
const currencyReward = dataNodeTemplate('currency-reward')!;

describe('dataNodeTemplate()', () => {
	it('finds templates by ID', () => {
		expect(dataNodeTemplate('item-reward')?.name).toBe('Item Reward');
		expect(dataNodeTemplate('currency-reward')?.name).toBe('Currency Reward');
	});

	it('returns undefined for undefined or unknown IDs', () => {
		expect(dataNodeTemplate(undefined)).toBeUndefined();
		expect(dataNodeTemplate('bad')).toBeUndefined();
	});

	it('has unique IDs across all templates', () => {
		const ids = dataNodeTemplates.map(({id}) => id);

		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('templateFieldDefault()', () => {
	it('uses the field default when set', () => {
		const amount = currencyReward.fields.find(({name}) => name === 'amount')!;

		expect(templateFieldDefault(amount)).toBe(1);
	});

	it('defaults enum fields to their first option', () => {
		const category = itemReward.fields.find(({name}) => name === 'category')!;

		expect(templateFieldDefault(category)).toBe('pets');
	});

	it('defaults booleans to their template default', () => {
		const properties = itemReward.fields.find(
			({name}) => name === 'properties'
		)!;

		if (properties.type !== 'object') {
			throw new Error('properties should be an object field');
		}

		const neon = properties.fields.find(({name}) => name === 'neon')!;

		expect(templateFieldDefault(neon)).toBe(true);
	});

	it('defaults object fields to their required subfields only', () => {
		const properties = itemReward.fields.find(
			({name}) => name === 'properties'
		)!;

		// All of properties' subfields are optional, so it starts empty.

		expect(templateFieldDefault(properties)).toEqual({});
	});
});

describe('applyTemplate()', () => {
	it('fills required fields with defaults from an empty value', () => {
		expect(applyTemplate(itemReward, {})).toEqual({
			category: 'pets',
			kind: ''
		});
		expect(applyTemplate(currencyReward, {})).toEqual({kind: '', amount: 1});
	});

	it('treats non-object values as empty', () => {
		expect(applyTemplate(currencyReward, 'oops')).toEqual({
			kind: '',
			amount: 1
		});
	});

	it('keeps existing values with matching types and drops unknown fields', () => {
		expect(
			applyTemplate(itemReward, {category: 'pets', kind: 'dog', junk: true})
		).toEqual({category: 'pets', kind: 'dog'});
	});

	it('replaces existing values whose type does not match', () => {
		expect(applyTemplate(currencyReward, {kind: 5, amount: 10})).toEqual({
			kind: '',
			amount: 10
		});
	});

	it('keeps optional fields that are present', () => {
		expect(applyTemplate(itemReward, {kind: 'dog', amount: 3})).toEqual({
			category: 'pets',
			kind: 'dog',
			amount: 3
		});
	});

	it('keeps out-of-enum strings so validation can flag them', () => {
		expect(applyTemplate(itemReward, {category: 'misc', kind: 'x'})).toEqual({
			category: 'misc',
			kind: 'x'
		});
	});

	it('keeps optional object fields recursively', () => {
		expect(
			applyTemplate(itemReward, {
				category: 'pets',
				kind: 'dog',
				properties: {age: 2, junk: 1}
			})
		).toEqual({category: 'pets', kind: 'dog', properties: {age: 2}});
	});

	it('drops optional fields whose requirement is not met', () => {
		expect(
			applyTemplate(itemReward, {
				category: 'toys',
				kind: 'ball',
				properties: {age: 2}
			})
		).toEqual({category: 'toys', kind: 'ball'});
	});
});

describe('validateTemplateValue()', () => {
	it('accepts a minimal valid value', () => {
		expect(
			validateTemplateValue(itemReward, {category: 'toys', kind: 'ball'})
		).toEqual([]);
		expect(
			validateTemplateValue(currencyReward, {kind: 'gems', amount: 5})
		).toEqual([]);
	});

	it('accepts a fully-populated item reward', () => {
		expect(
			validateTemplateValue(itemReward, {
				category: 'pets',
				kind: 'dog',
				amount: 2,
				properties: {age: 6, neon: true, mega_neon: false}
			})
		).toEqual([]);
	});

	it('rejects non-object roots', () => {
		expect(validateTemplateValue(itemReward, [1])).toEqual([
			{message: 'Item Reward data must be a JSON object', path: []}
		]);
	});

	it('reports missing required fields', () => {
		expect(validateTemplateValue(itemReward, {category: 'toys'})).toEqual([
			{message: 'Missing required field "kind"', path: []}
		]);
	});

	it('reports type mismatches', () => {
		expect(
			validateTemplateValue(currencyReward, {kind: 'gems', amount: 'lots'})
		).toEqual([{message: '"amount" must be a number', path: ['amount']}]);
	});

	it('enforces minimums and maximums on numbers', () => {
		expect(
			validateTemplateValue(currencyReward, {kind: 'gems', amount: 0})
		).toEqual([{message: '"amount" must be at least 1', path: ['amount']}]);
		expect(
			validateTemplateValue(itemReward, {
				category: 'pets',
				kind: 'dog',
				properties: {age: 7}
			})
		).toEqual([
			{message: '"age" must be at most 6', path: ['properties', 'age']}
		]);
	});

	it('enforces enum fields', () => {
		expect(
			validateTemplateValue(itemReward, {category: 'weapons', kind: 'sword'})
		).toEqual([
			{
				message:
					'"category" must be one of "pets", "gifts", "toys", "transport", "food", "stickers"',
				path: ['category']
			}
		]);
		expect(
			validateTemplateValue(itemReward, {category: 'stickers', kind: 'star'})
		).toEqual([]);
	});

	it('enforces field requirements', () => {
		expect(
			validateTemplateValue(itemReward, {
				category: 'toys',
				kind: 'ball',
				properties: {}
			})
		).toEqual([
			{
				message: '"properties" is only allowed when "category" is "pets"',
				path: ['properties']
			}
		]);
	});

	it('reports fields outside the template, including nested ones', () => {
		expect(
			validateTemplateValue(itemReward, {
				category: 'pets',
				kind: 'dog',
				junk: 1,
				properties: {sparkle: true}
			})
		).toEqual(
			expect.arrayContaining([
				{
					message: `"junk" isn't part of the Item Reward template`,
					path: ['junk']
				},
				{
					message: `"sparkle" isn't part of the Item Reward template`,
					path: ['properties', 'sparkle']
				}
			])
		);
	});

	it('flags silent fields entered by hand', () => {
		expect(
			validateTemplateValue(currencyReward, {
				category: 'currency',
				kind: 'gems',
				amount: 1
			})
		).toEqual([
			{
				message:
					'"category" is added automatically by the Currency Reward template at export',
				path: ['category']
			}
		]);
	});
});

describe('mergeSilentValues()', () => {
	it('merges silent values over user data', () => {
		expect(
			mergeSilentValues(currencyReward, {
				kind: 'gems',
				amount: 5,
				category: 'oops'
			})
		).toEqual({kind: 'gems', amount: 5, category: 'currency'});
	});

	it('returns data unchanged for templates without silent values', () => {
		const data = {category: 'pets', kind: 'dog'};

		expect(mergeSilentValues(itemReward, data)).toBe(data);
	});

	it('leaves non-object data alone', () => {
		expect(mergeSilentValues(currencyReward, 'raw text')).toBe('raw text');
		expect(mergeSilentValues(currencyReward, [1, 2])).toEqual([1, 2]);
	});
});
