import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconUser} from '@tabler/icons';
import {IconButton} from '../../../../components/control/icon-button';
import {createUntitledNpcNode, Story} from '../../../../store/stories';
import {useUndoableStoriesContext} from '../../../../store/undoable-stories';
import {Point} from '../../../../util/geometry';

export interface CreateNpcNodeButtonProps {
	getCenter: () => Point;
	story: Story;
}

export const CreateNpcNodeButton: React.FC<
	CreateNpcNodeButtonProps
> = props => {
	const {getCenter, story} = props;
	const {dispatch} = useUndoableStoriesContext();
	const handleClick = React.useCallback(() => {
		const {left, top} = getCenter();

		dispatch(
			createUntitledNpcNode(story, left, top),
			'undoChange.newNpcNode'
		);
	}, [dispatch, getCenter, story]);
	const {t} = useTranslation();

	return (
		<IconButton
			icon={<IconUser />}
			label={t('routes.storyEdit.toolbar.newNpcNode')}
			onClick={handleClick}
		/>
	);
};
