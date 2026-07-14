import {npcNodeDefaults} from '../defaults';
import {CreatePassageAction, Story} from '../stories.types';
import {createUntitledPassage} from './create-untitled-passage';

/**
 * Creates a new, untitled NPC node centered at a point in the story. An NPC
 * node is a data node using the `npc` template, which holds no data beyond
 * its name. Like `createUntitledPassage`, this automatically increments a
 * number at the end of the node name to ensure it's unique.
 */
export function createUntitledNpcNode(
	story: Story,
	centerX: number,
	centerY: number
): CreatePassageAction {
	const defs = npcNodeDefaults();

	return createUntitledPassage(story, centerX, centerY, {
		dataTemplate: defs.dataTemplate,
		name: defs.name,
		text: defs.text,
		type: defs.type
	});
}
