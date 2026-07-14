import {DataNodeTemplate} from '../../util/data-node-templates';
import {templateAnnotations} from '../data-template-lint';

const template: DataNodeTemplate = {
	id: 'test',
	name: 'Test',
	silentValues: {},
	fields: [
		{name: 'kind', type: 'string'},
		{name: 'scores', type: 'array', optional: true, item: {type: 'number'}}
	]
};

describe('templateAnnotations()', () => {
	it('returns no annotations for conforming JSON', () => {
		expect(
			templateAnnotations('{"kind": "a", "scores": [1, 2]}', template)
		).toEqual([]);
	});

	it('returns no annotations for JSON that does not parse', () => {
		expect(templateAnnotations('{oops', template)).toEqual([]);
	});

	it('anchors errors at the offending key', () => {
		const text = '{\n  "kind": 5\n}';
		const result = templateAnnotations(text, template);

		expect(result.length).toBe(1);
		expect(result[0].message).toBe('"kind" must be a string');
		expect(result[0].from).toEqual({line: 1, ch: 2});
		expect(result[0].to).toEqual({line: 1, ch: 8});
	});

	it('anchors array item errors at the array key', () => {
		const text = '{\n  "kind": "a",\n  "scores": [1, "x"]\n}';
		const result = templateAnnotations(text, template);

		expect(result.length).toBe(1);
		expect(result[0].message).toBe('item 2 of "scores" must be a number');
		expect(result[0].from).toEqual({line: 2, ch: 2});
		expect(result[0].to).toEqual({line: 2, ch: 10});
	});
});
