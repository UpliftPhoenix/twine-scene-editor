import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';
import {createUntitledTemplateNode, Story} from '../../../../store/stories';
import {useUndoableStoriesContext} from '../../../../store/undoable-stories';
import {DataNodeTemplate} from '../../../../util/data-node-templates';
import {Point} from '../../../../util/geometry';

export interface CreateTemplateNodeButtonProps {
	getCenter: () => Point;
	story: Story;
	template: DataNodeTemplate;
}

/**
 * Creates a new data node preset with a template, labeled and iconed after
 * the template itself.
 */
export const CreateTemplateNodeButton: React.FC<
	CreateTemplateNodeButtonProps
> = props => {
	const {getCenter, story, template} = props;
	const {dispatch} = useUndoableStoriesContext();
	const handleClick = React.useCallback(() => {
		const {left, top} = getCenter();

		dispatch(
			createUntitledTemplateNode(story, left, top, template),
			`undoChange.newTemplateNode.${template.id}`
		);
	}, [dispatch, getCenter, story, template]);
	const {t} = useTranslation();

	return (
		<IconButton
			icon={<img src={template.cardImage} alt="" />}
			label={t('routes.storyEdit.toolbar.newTemplateNode', {
				name: template.name
			})}
			onClick={handleClick}
		/>
	);
};
