import {IconCode, IconLayoutGrid} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {ButtonBar} from '../../components/container/button-bar';
import {IconButton} from '../../components/control/icon-button';
import {RenamePassageButton} from '../../components/passage/rename-passage-button';
import {TagCardButton} from '../../components/tag/tag-card-button';
import {
	addPassageTag,
	Passage,
	removePassageTag,
	setTagColor,
	Story,
	storyPassageTags,
	updatePassage
} from '../../store/stories';
import {useUndoableStoriesContext} from '../../store/undoable-stories';
import {Color} from '../../util/color';
import {DataNodeJsonEditor} from './data-node-json-editor';
import {JsonBuilder} from './json-builder';

export interface DataNodeEditContentsProps {
	localText: string;
	onChangeLocalText: (text: string) => void;
	passage: Passage;
	story: Story;
}

export const DataNodeEditContents: React.FC<
	DataNodeEditContentsProps
> = props => {
	const {localText, onChangeLocalText, passage, story} = props;
	const [view, setView] = React.useState<'text' | 'visual'>('visual');
	const {dispatch} = useUndoableStoriesContext();
	const {t} = useTranslation();
	const passageTags = storyPassageTags(story);

	function handleAddTag(name: string) {
		dispatch(addPassageTag(story, passage, name), t('undoChange.addTag'));
	}

	function handleChangeTagColor(name: string, color: Color) {
		dispatch(setTagColor(story, name, color));
	}

	function handleRemoveTag(name: string) {
		dispatch(removePassageTag(story, passage, name), t('undoChange.removeTag'));
	}

	function handleRename(name: string) {
		// Data nodes can't be linked to, so there are never links to update in
		// other passages.

		dispatch(
			updatePassage(story, passage, {name}, {dontUpdateOthers: true}),
			t('undoChange.renameDataNode')
		);
	}

	return (
		<>
			<ButtonBar>
				<TagCardButton
					allTags={passageTags}
					id={`data-node-tag-input-${passage.id}`}
					onAdd={handleAddTag}
					onChangeColor={handleChangeTagColor}
					onRemove={handleRemoveTag}
					tagColors={story.tagColors}
					tags={passage.tags}
				/>
				<RenamePassageButton
					onRename={handleRename}
					passage={passage}
					story={story}
				/>
				<IconButton
					icon={<IconLayoutGrid />}
					label={t('dialogs.dataNodeEdit.visualView')}
					onClick={() => setView('visual')}
					selectable
					selected={view === 'visual'}
				/>
				<IconButton
					icon={<IconCode />}
					label={t('dialogs.dataNodeEdit.textView')}
					onClick={() => setView('text')}
					selectable
					selected={view === 'text'}
				/>
			</ButtonBar>
			{view === 'text' ? (
				<DataNodeJsonEditor
					onChangeText={onChangeLocalText}
					passage={passage}
					value={localText}
				/>
			) : (
				<JsonBuilder onChange={onChangeLocalText} value={localText} />
			)}
		</>
	);
};
