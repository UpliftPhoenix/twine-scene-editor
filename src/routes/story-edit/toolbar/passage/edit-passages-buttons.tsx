import {IconEdit} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';
import {
	addPassageEditors,
	DataNodeEditDialog,
	useDialogsContext
} from '../../../../dialogs';
import {Passage, Story} from '../../../../store/stories';

export interface EditPassagesButtonProps {
	passages: Passage[];
	story: Story;
}

export const EditPassagesButton: React.FC<EditPassagesButtonProps> = props => {
	const {passages, story} = props;
	const {dispatch} = useDialogsContext();
	const {t} = useTranslation();

	function handleClick() {
		// Data nodes open in their own editor dialog instead of the passage
		// editor stack.

		const normalPassages = passages.filter(({type}) => type !== 'data');
		const dataNodes = passages.filter(({type}) => type === 'data');

		if (normalPassages.length > 0) {
			dispatch(
				addPassageEditors(
					story.id,
					normalPassages.map(({id}) => id)
				)
			);
		}

		for (const dataNode of dataNodes) {
			dispatch({
				type: 'addDialog',
				component: DataNodeEditDialog,
				props: {passageId: dataNode.id, storyId: story.id}
			});
		}
	}

	return (
		<IconButton
			disabled={passages.length === 0}
			icon={<IconEdit />}
			label={
				passages.length > 1
					? t('common.editCount', {count: passages.length})
					: t('common.edit')
			}
			onClick={handleClick}
		/>
	);
};
