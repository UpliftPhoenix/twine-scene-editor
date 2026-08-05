import {fakePassage} from '../../test-util';
import {
	isNegationTag,
	nodeNegationTag,
	tagLinkHandleOrigin,
	tagLinkHasNegation,
	tagLinkName,
	tagLinkNegationTag,
	tagLinkNodeName,
	tagsWithNegation,
	tagsWithoutOrphanedNegation
} from '../tag-link';

describe('tagLinkNodeName', () => {
	it('leaves names without whitespace alone', () =>
		expect(tagLinkNodeName('MyTrigger')).toBe('MyTrigger'));

	it('replaces runs of whitespace with dashes', () =>
		expect(tagLinkNodeName('Untitled  Data\tNode')).toBe('Untitled-Data-Node'));

	it('trims leading and trailing whitespace', () =>
		expect(tagLinkNodeName('  spaced out  ')).toBe('spaced-out'));
});

describe('tagLinkName', () => {
	it('returns templateId:nodeName for data nodes with a tag-linkable template', () => {
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'trigger', name: 'My Trigger', type: 'data'})
			)
		).toBe('trigger:My-Trigger');
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'requirement', name: 'Req', type: 'data'})
			)
		).toBe('requirement:Req');
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'npc', name: 'Shop Keeper', type: 'data'})
			)
		).toBe('npc:Shop-Keeper');
	});

	it('returns undefined for regular passages', () => {
		expect(tagLinkName(fakePassage())).toBeUndefined();
		expect(
			tagLinkName(fakePassage({dataTemplate: 'trigger'}))
		).toBeUndefined();
	});

	it('returns undefined for data nodes without a template', () =>
		expect(tagLinkName(fakePassage({type: 'data'}))).toBeUndefined());

	it("returns undefined for data nodes whose template isn't tag-linkable", () =>
		expect(
			tagLinkName(fakePassage({dataTemplate: 'item-reward', type: 'data'}))
		).toBeUndefined());

	it('returns undefined for data nodes with an unknown template', () =>
		expect(
			tagLinkName(fakePassage({dataTemplate: 'nonexistent', type: 'data'}))
		).toBeUndefined());
});

describe('tagLinkHandleOrigin', () => {
	it("returns the center of the node's right edge", () =>
		expect(
			tagLinkHandleOrigin({left: 10, top: 20, width: 100, height: 50})
		).toEqual({left: 110, top: 45}));
});

describe('isNegationTag', () => {
	it('returns true for tags beginning with not:', () => {
		expect(isNegationTag('not:My-Trigger')).toBe(true);
		expect(isNegationTag('not:')).toBe(true);
	});

	it('returns false for other tags', () => {
		expect(isNegationTag('trigger:My-Trigger')).toBe(false);
		expect(isNegationTag('nope')).toBe(false);
		expect(isNegationTag('priority:1')).toBe(false);
	});
});

describe('tagLinkHasNegation', () => {
	it('returns true for tag links to templates that allow negation', () => {
		expect(tagLinkHasNegation('trigger:My-Trigger')).toBe(true);
		expect(tagLinkHasNegation('requirement:Req')).toBe(true);
	});

	it("returns false for tag links to templates that don't", () =>
		expect(tagLinkHasNegation('npc:Shop-Keeper')).toBe(false));

	it("returns false for tags that aren't tag links", () => {
		expect(tagLinkHasNegation('unrelated')).toBe(false);
		expect(tagLinkHasNegation('nonexistent:Thing')).toBe(false);
	});
});

describe('tagLinkNegationTag', () => {
	it('returns the negation tag for a negatable tag link', () => {
		expect(tagLinkNegationTag('trigger:My-Trigger')).toBe('not:My-Trigger');
		expect(tagLinkNegationTag('requirement:Req')).toBe('not:Req');
	});

	it('returns undefined for tags whose links cannot be negated', () => {
		expect(tagLinkNegationTag('npc:Shop-Keeper')).toBeUndefined();
		expect(tagLinkNegationTag('unrelated')).toBeUndefined();
	});
});

describe('nodeNegationTag', () => {
	it('returns the negation tag for a data node whose links can be negated', () =>
		expect(
			nodeNegationTag(
				fakePassage({dataTemplate: 'trigger', name: 'My Trigger', type: 'data'})
			)
		).toBe('not:My-Trigger'));

	it('returns undefined for nodes whose links cannot be negated', () => {
		expect(
			nodeNegationTag(
				fakePassage({dataTemplate: 'npc', name: 'Shop Keeper', type: 'data'})
			)
		).toBeUndefined();
		expect(nodeNegationTag(fakePassage())).toBeUndefined();
	});
});

describe('tagsWithNegation', () => {
	it('adds the negation tag when negating', () =>
		expect(
			tagsWithNegation(['trigger:My-Trigger'], 'not:My-Trigger', true)
		).toEqual(['trigger:My-Trigger', 'not:My-Trigger']));

	it("doesn't add the negation tag twice", () =>
		expect(
			tagsWithNegation(
				['trigger:My-Trigger', 'not:My-Trigger'],
				'not:My-Trigger',
				true
			)
		).toEqual(['trigger:My-Trigger', 'not:My-Trigger']));

	it('removes the negation tag when un-negating', () =>
		expect(
			tagsWithNegation(
				['trigger:My-Trigger', 'not:My-Trigger', 'unrelated'],
				'not:My-Trigger',
				false
			)
		).toEqual(['trigger:My-Trigger', 'unrelated']));

	it('leaves other negation tags alone', () =>
		expect(
			tagsWithNegation(['not:Other'], 'not:My-Trigger', false)
		).toEqual(['not:Other']));
});

describe('tagsWithoutOrphanedNegation', () => {
	it('keeps negation tags justified by a negatable tag link', () =>
		expect(
			tagsWithoutOrphanedNegation([
				'trigger:My-Trigger',
				'not:My-Trigger',
				'unrelated'
			])
		).toEqual(['trigger:My-Trigger', 'not:My-Trigger', 'unrelated']));

	it('removes negation tags with no matching tag link', () =>
		expect(
			tagsWithoutOrphanedNegation(['trigger:My-Trigger', 'not:Other'])
		).toEqual(['trigger:My-Trigger']));

	it("removes negation tags whose tag link can't be negated", () =>
		expect(
			tagsWithoutOrphanedNegation(['npc:Shop-Keeper', 'not:Shop-Keeper'])
		).toEqual(['npc:Shop-Keeper']));

	it('leaves tags without any negation tags alone', () =>
		expect(tagsWithoutOrphanedNegation(['trigger:My-Trigger'])).toEqual([
			'trigger:My-Trigger'
		]));
});
