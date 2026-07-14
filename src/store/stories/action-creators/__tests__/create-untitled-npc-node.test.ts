import {createUntitledNpcNode} from '../create-untitled-npc-node';
import {Story} from '../../stories.types';
import {fakeStory} from '../../../../test-util';
import {npcNodeDefaults} from '../../defaults';

describe('createUntitledNpcNode', () => {
	const defs = npcNodeDefaults();
	let story: Story;

	beforeEach(() => {
		story = fakeStory(1);
		story.passages[0].name = 'mock-passage-1';

		// Pin the existing passage far away so it never overlaps the new node.

		story.passages[0].left = 5000;
		story.passages[0].top = 5000;
	});

	it('creates an NPC node centered at the position given', () => {
		expect(createUntitledNpcNode(story, 1000, 1000)).toEqual({
			type: 'createPassage',
			props: {
				dataTemplate: 'npc',
				height: defs.height,
				left: 1000 - defs.width / 2,
				name: defs.name,
				story: story.id,
				text: '{}',
				top: 1000 - defs.height / 2,
				type: 'data',
				width: defs.width
			},
			storyId: story.id
		});
	});

	it('adds a number at the end of the node name until a unique one is reached', () => {
		story.passages[0].name = defs.name;

		expect(createUntitledNpcNode(story, 1000, 1000)).toEqual({
			type: 'createPassage',
			props: expect.objectContaining({
				name: `${defs.name} 1`
			}),
			storyId: story.id
		});
	});
});
