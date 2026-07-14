import {
	applyTemplate,
	DataNodeTemplate
} from '../../../util/data-node-templates';
import {i18n} from '../../../util/i18n';
import {CreatePassageAction, Story} from '../stories.types';
import {createUntitledPassage} from './create-untitled-passage';

/**
 * Creates a new, untitled data node centered at a point in the story, preset
 * with a template: the node's `dataTemplate` field is set and its text starts
 * with the template's required fields filled in with their defaults. Like
 * `createUntitledPassage`, this automatically increments a number at the end
 * of the node name to ensure it's unique.
 */
export function createUntitledTemplateNode(
	story: Story,
	centerX: number,
	centerY: number,
	template: DataNodeTemplate
): CreatePassageAction {
	return createUntitledPassage(story, centerX, centerY, {
		dataTemplate: template.id,
		name: i18n.t('store.templateNodeDefaults.name', {name: template.name}),
		text: JSON.stringify(applyTemplate(template, {}), null, 2),
		type: 'data'
	});
}
