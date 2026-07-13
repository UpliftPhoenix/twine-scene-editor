import {dataNodeDefaults} from '../defaults';
import {CreatePassageAction, Story} from '../stories.types';
import {createUntitledPassage} from './create-untitled-passage';

/**
 * Creates a new, untitled data node centered at a point in the story. Like
 * `createUntitledPassage`, this automatically increments a number at the end
 * of the node name to ensure it's unique.
 */
export function createUntitledDataNode(
	story: Story,
	centerX: number,
	centerY: number
): CreatePassageAction {
	const defs = dataNodeDefaults();

	return createUntitledPassage(story, centerX, centerY, {
		name: defs.name,
		text: defs.text,
		type: defs.type
	});
}
