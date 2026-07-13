import {jsonAnnotations} from '../json-lint';

describe('jsonAnnotations()', () => {
	it('returns no annotations for valid JSON', () => {
		expect(jsonAnnotations('{"a": 1}')).toEqual([]);
		expect(jsonAnnotations('[1, 2, 3]')).toEqual([]);
		expect(jsonAnnotations('"just a string"')).toEqual([]);
		expect(jsonAnnotations('null')).toEqual([]);
	});

	it('returns no annotations for an empty document', () => {
		expect(jsonAnnotations('')).toEqual([]);
		expect(jsonAnnotations('  \n ')).toEqual([]);
	});

	it('returns an error annotation for invalid JSON', () => {
		const result = jsonAnnotations('{"a": }');

		expect(result.length).toBe(1);
		expect(result[0].severity).toBe('error');
		expect(typeof result[0].message).toBe('string');
		expect(result[0].from.line).toBe(0);
	});

	it('places the annotation on the line where the error occurred', () => {
		const result = jsonAnnotations('{\n"a": 1,\n"b": oops\n}');

		expect(result.length).toBe(1);
		expect(result[0].from.line).toBe(2);
	});
});
