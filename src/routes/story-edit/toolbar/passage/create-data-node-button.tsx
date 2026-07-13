import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconDatabase} from '@tabler/icons';
import {IconButton} from '../../../../components/control/icon-button';
import {createUntitledDataNode, Story} from '../../../../store/stories';
import {useUndoableStoriesContext} from '../../../../store/undoable-stories';
import {Point} from '../../../../util/geometry';

export interface CreateDataNodeButtonProps {
	getCenter: () => Point;
	story: Story;
}

export const CreateDataNodeButton: React.FC<
	CreateDataNodeButtonProps
> = props => {
	const {getCenter, story} = props;
	const {dispatch} = useUndoableStoriesContext();
	const handleClick = React.useCallback(() => {
		const {left, top} = getCenter();

		dispatch(
			createUntitledDataNode(story, left, top),
			'undoChange.newDataNode'
		);
	}, [dispatch, getCenter, story]);
	const {t} = useTranslation();

	return (
		<IconButton
			icon={<IconDatabase />}
			label={t('routes.storyEdit.toolbar.newDataNode')}
			onClick={handleClick}
		/>
	);
};
