import {
	appendJsonValue,
	defaultJsonValue,
	getJsonValueAtPath,
	JsonObject,
	jsonValueType,
	removeJsonValueAtPath,
	renameJsonKey,
	setJsonValueAtPath,
	unusedJsonKey
} from '../json-builder-utils';

describe('jsonValueType()', () => {
	it.each([
		['string', 'a'],
		['number', 1],
		['boolean', true],
		['null', null],
		['array', []],
		['object', {}]
	])('returns %s', (type, value) => expect(jsonValueType(value)).toBe(type));
});

describe('defaultJsonValue()', () => {
	it('returns sensible empty values', () => {
		expect(defaultJsonValue('string')).toBe('');
		expect(defaultJsonValue('number')).toBe(0);
		expect(defaultJsonValue('boolean')).toBe(false);
		expect(defaultJsonValue('object')).toEqual({});
		expect(defaultJsonValue('array')).toEqual([]);
	});
});

describe('getJsonValueAtPath()', () => {
	it('returns the root for an empty path', () =>
		expect(getJsonValueAtPath({a: 1}, [])).toEqual({a: 1}));

	it('returns nested values', () =>
		expect(getJsonValueAtPath({a: [{b: 'c'}]}, ['a', 0, 'b'])).toBe('c'));
});

describe('setJsonValueAtPath()', () => {
	it('replaces the root for an empty path', () =>
		expect(setJsonValueAtPath({a: 1}, [], [2])).toEqual([2]));

	it('replaces nested values immutably', () => {
		const root = {a: [{b: 'c'}], d: 4};
		const result = setJsonValueAtPath(root, ['a', 0, 'b'], 'e');

		expect(result).toEqual({a: [{b: 'e'}], d: 4});
		expect(root).toEqual({a: [{b: 'c'}], d: 4});
	});
});

describe('removeJsonValueAtPath()', () => {
	it('removes object keys', () =>
		expect(removeJsonValueAtPath({a: 1, b: 2}, ['b'])).toEqual({a: 1}));

	it('removes array items, shifting later ones down', () =>
		expect(removeJsonValueAtPath({a: [1, 2, 3]}, ['a', 1])).toEqual({
			a: [1, 3]
		}));

	it('throws when removing the root', () =>
		expect(() => removeJsonValueAtPath({}, [])).toThrow());
});

describe('unusedJsonKey()', () => {
	it('returns the base key when unused', () =>
		expect(unusedJsonKey({})).toBe('key'));

	it('appends a counter when the base key is used', () => {
		expect(unusedJsonKey({key: 1})).toBe('key 2');
		expect(unusedJsonKey({key: 1, 'key 2': 2})).toBe('key 3');
	});
});

describe('appendJsonValue()', () => {
	it('appends to arrays', () =>
		expect(appendJsonValue([1], [], 'string')).toEqual([1, '']));

	it('adds to objects with a generated key', () =>
		expect(appendJsonValue({key: 1}, [], 'object')).toEqual({
			key: 1,
			'key 2': {}
		}));

	it('appends to nested containers', () =>
		expect(appendJsonValue({a: {b: []}}, ['a', 'b'], 'number')).toEqual({
			a: {b: [0]}
		}));

	it('throws when appending to a non-container', () =>
		expect(() => appendJsonValue({a: 1}, ['a'], 'number')).toThrow());
});

describe('renameJsonKey()', () => {
	it('renames a key, preserving entry order', () => {
		const result = renameJsonKey({a: 1, b: 2, c: 3}, [], 'b', 'z') as JsonObject;

		expect(result).toEqual({a: 1, z: 2, c: 3});
		expect(Object.keys(result)).toEqual(['a', 'z', 'c']);
	});

	it('renames keys in nested objects', () =>
		expect(renameJsonKey({a: {b: 1}}, ['a'], 'b', 'c')).toEqual({a: {c: 1}}));

	it('makes no change if the new key already exists', () =>
		expect(renameJsonKey({a: 1, b: 2}, [], 'a', 'b')).toEqual({a: 1, b: 2}));
});
