import {fakePassage, fakeStory} from '../../test-util';
import {AppInfo} from '../app-info';
import {dataNodeTemplate} from '../data-node-templates';
import {storyToJson, storyToJsonData} from '../story-to-json';

// Wrap the template lookup so tests can substitute templates that don't exist
// in the real registry, e.g. one with silent values.

jest.mock('../data-node-templates', () => ({
	...jest.requireActual('../data-node-templates'),
	dataNodeTemplate: jest.fn()
}));

describe('storyToJsonData()', () => {
	const appInfo: AppInfo = {name: 'mock-app', version: '1.2.3'};

	beforeEach(() => {
		jest.spyOn(Date, 'now').mockReturnValue(12345);
		(dataNodeTemplate as jest.Mock).mockImplementation(
			jest.requireActual('../data-node-templates').dataNodeTemplate
		);
	});

	afterEach(() => jest.restoreAllMocks());

	it('sets story properties from the story and app info', () => {
		const story = fakeStory(0);
		const result = storyToJsonData(story, appInfo);

		expect(result).toEqual({
			uuid: story.ifid,
			name: story.name,
			creator: 'mock-app',
			creatorVersion: '1.2.3',
			schemaName: story.storyFormat,
			schemaVersion: story.storyFormatVersion,
			createdAtMs: 12345,
			passages: [],
			data: []
		});
	});

	describe('data nodes', () => {
		it('exports data nodes in a data array, not passages', () => {
			const story = fakeStory(2);

			story.passages[1].type = 'data';
			story.passages[1].text = '{"speed": 3, "flying": true}';

			const result = storyToJsonData(story, appInfo);

			expect(result.passages.length).toBe(1);
			expect(result.passages[0].name).toBe(story.passages[0].name);
			expect(result.data).toEqual([
				{
					name: story.passages[1].name,
					tags: story.passages[1].tags.join(' '),
					id: '1',
					data: {speed: 3, flying: true}
				}
			]);
		});

		it('assigns data nodes sequential string IDs independent of passages', () => {
			const story = fakeStory(3);

			story.passages[1].type = 'data';
			story.passages[1].text = '1';
			story.passages[2].type = 'data';
			story.passages[2].text = '2';

			const result = storyToJsonData(story, appInfo);

			expect(result.passages.map(({id}) => id)).toEqual(['1']);
			expect(result.data.map(({id}) => id)).toEqual(['1', '2']);
		});

		it('exports the raw text of a data node whose text is invalid JSON', () => {
			const story = fakeStory(1);

			story.passages[0].type = 'data';
			story.passages[0].text = '{oops';

			expect(storyToJsonData(story, appInfo).data[0].data).toBe('{oops');
		});

		it("merges a data node's template silent values into its exported data", () => {
			(dataNodeTemplate as jest.Mock).mockReturnValueOnce({
				id: 'test-silent',
				name: 'Test Silent',
				silentValues: {category: 'currency'},
				fields: []
			});

			const story = fakeStory(1);

			story.passages[0].type = 'data';
			story.passages[0].dataTemplate = 'test-silent';
			story.passages[0].text = '{"kind": "gems", "amount": 5}';

			expect(storyToJsonData(story, appInfo).data[0].data).toEqual({
				category: 'currency',
				kind: 'gems',
				amount: 5
			});
		});

		it('exports data nodes with an unknown template as-is', () => {
			const story = fakeStory(1);

			story.passages[0].type = 'data';
			story.passages[0].dataTemplate = 'no-such-template';
			story.passages[0].text = '{"kind": "gems"}';

			expect(storyToJsonData(story, appInfo).data[0].data).toEqual({
				kind: 'gems'
			});
		});

		it("exports a data node's template ID as templateId", () => {
			const story = fakeStory(1);

			story.passages[0].type = 'data';
			story.passages[0].dataTemplate = 'trigger';
			story.passages[0].text = '{}';

			expect(storyToJsonData(story, appInfo).data[0].templateId).toBe(
				'trigger'
			);
		});

		it('omits templateId for data nodes without a template or with an unknown template', () => {
			const story = fakeStory(2);

			story.passages[0].type = 'data';
			story.passages[0].text = '{"kind": "gems"}';
			story.passages[1].type = 'data';
			story.passages[1].dataTemplate = 'no-such-template';
			story.passages[1].text = '{"kind": "gems"}';

			const result = storyToJsonData(story, appInfo);

			expect(result.data[0]).not.toHaveProperty('templateId');
			expect(result.data[1]).not.toHaveProperty('templateId');
		});
	});

	it('assigns passages sequential string IDs and space-separated tags', () => {
		const story = fakeStory(2);

		story.passages[0].tags = ['one', 'two'];
		story.passages[1].tags = [];

		const result = storyToJsonData(story, appInfo);

		expect(result.passages[0].id).toBe('1');
		expect(result.passages[0].tags).toBe('one two');
		expect(result.passages[0].name).toBe(story.passages[0].name);
		expect(result.passages[1].id).toBe('2');
		expect(result.passages[1].tags).toBe('');
	});

	it('trims passage text', () => {
		const story = fakeStory(1);

		story.passages[0].text = '  some text\n';

		expect(storyToJsonData(story, appInfo).passages[0].text).toBe('some text');
	});

	describe('link extraction', () => {
		function linksOf(text: string) {
			const story = fakeStory(1);

			story.passages[0].text = text;
			return storyToJsonData(story, appInfo).passages[0];
		}

		it('extracts simple links', () => {
			expect(linksOf('Go [[There]].').links).toEqual([
				{linkText: 'There', passageName: 'There', original: '[[There]]'}
			]);
		});

		it('extracts right-arrow links', () => {
			expect(linksOf('[[Click me -> Target]]').links).toEqual([
				{
					linkText: 'Click me',
					passageName: 'Target',
					original: '[[Click me -> Target]]'
				}
			]);
		});

		it('extracts left-arrow links', () => {
			expect(linksOf('[[Target <- Click me]]').links).toEqual([
				{
					linkText: 'Click me',
					passageName: 'Target',
					original: '[[Target <- Click me]]'
				}
			]);
		});

		it('extracts multiple links', () => {
			expect(linksOf('[[a]] and [[b]]').links).toEqual([
				{linkText: 'a', passageName: 'a', original: '[[a]]'},
				{linkText: 'b', passageName: 'b', original: '[[b]]'}
			]);
		});

		it('removes links from cleanText', () => {
			expect(linksOf('Go [[There]].').cleanText).toBe('Go .');
		});
	});

	describe('with a Harlowe 3 story', () => {
		function passageOf(text: string) {
			const story = fakeStory(1);

			story.storyFormat = 'Harlowe';
			story.storyFormatVersion = '3.3.5';
			story.passages[0].text = text;
			return storyToJsonData(story, appInfo).passages[0];
		}

		it('extracts named hooks of the form |name>[text]', () => {
			expect(passageOf('|aside>[a note]').hooks).toEqual([
				{hookName: 'aside', hookText: 'a note', original: '|aside>[a note]'}
			]);
		});

		it('extracts named hooks of the form [text]<name|', () => {
			expect(passageOf('x [a note]<aside| y').hooks).toEqual([
				{hookName: 'aside', hookText: 'a note', original: '[a note]<aside|'}
			]);
		});

		it('extracts anonymous hooks', () => {
			expect(passageOf('(if: true)[shown]').hooks).toEqual([
				{hookName: undefined, hookText: 'shown', original: '[shown]'}
			]);
		});

		it('removes hooks from cleanText', () => {
			expect(passageOf('before |aside>[a note] after').cleanText).toBe(
				'before  after'
			);
		});
	});

	describe('with a non-Harlowe story', () => {
		it('omits hooks from passages', () => {
			const story = fakeStory(1);

			story.storyFormat = 'SugarCube';
			story.storyFormatVersion = '2.36.1';
			story.passages[0].text = '|aside>[a note]';

			const passage = storyToJsonData(story, appInfo).passages[0];

			expect(passage).not.toHaveProperty('hooks');
			expect(passage.cleanText).toBe('|aside>[a note]');
		});
	});
});

describe('storyToJson()', () => {
	it('returns formatted JSON of storyToJsonData()', () => {
		jest.spyOn(Date, 'now').mockReturnValue(12345);

		const appInfo = {name: 'mock-app', version: '1.2.3'};
		const story = fakeStory(1);

		story.passages[0] = fakePassage({
			name: 'Start',
			story: story.id,
			tags: [],
			text: 'Hello [[world]]'
		});

		expect(JSON.parse(storyToJson(story, appInfo))).toEqual(
			storyToJsonData(story, appInfo)
		);
		jest.restoreAllMocks();
	});
});
