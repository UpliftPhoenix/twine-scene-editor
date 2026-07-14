import {createUntitledTemplateNode} from '../create-untitled-template-node';
import {Story} from '../../stories.types';
import {fakeStory} from '../../../../test-util';
import {passageDefaults} from '../../defaults';
import {dataNodeTemplate} from '../../../../util/data-node-templates';
import {i18n} from '../../../../util/i18n';

describe('createUntitledTemplateNode', () => {
	const defs = passageDefaults();
	const npc = dataNodeTemplate('npc')!;
	const requirement = dataNodeTemplate('requirement')!;
	let story: Story;

	beforeEach(() => {
		story = fakeStory(1);
		story.passages[0].name = 'mock-passage-1';

		// Pin the existing passage far away so it never overlaps the new node.

		story.passages[0].left = 5000;
		story.passages[0].top = 5000;
	});

	it('creates a data node using the template centered at the position given', () => {
		expect(createUntitledTemplateNode(story, 1000, 1000, npc)).toEqual({
			type: 'createPassage',
			props: {
				dataTemplate: 'npc',
				height: defs.height,
				left: 1000 - defs.width / 2,
				name: i18n.t('store.templateNodeDefaults.name', {name: npc.name}),
				story: story.id,
				text: '{}',
				top: 1000 - defs.height / 2,
				type: 'data',
				width: defs.width
			},
			storyId: story.id
		});
	});

	it("presets the node's text with the template's required fields", () => {
		const action = createUntitledTemplateNode(story, 1000, 1000, requirement);

		expect(JSON.parse(action.props.text!)).toEqual({
			type: 'item_owned',
			items: []
		});
	});

	it('adds a number at the end of the node name until a unique one is reached', () => {
		const name = i18n.t('store.templateNodeDefaults.name', {name: npc.name});

		story.passages[0].name = name;

		expect(createUntitledTemplateNode(story, 1000, 1000, npc)).toEqual({
			type: 'createPassage',
			props: expect.objectContaining({
				name: `${name} 1`
			}),
			storyId: story.id
		});
	});
});
