import {IconCode, IconLayoutGrid, IconTemplate} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {ButtonBar} from '../../components/container/button-bar';
import {IconButton} from '../../components/control/icon-button';
import {MenuButton} from '../../components/control/menu-button';
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
import {
	applyTemplate,
	dataNodeTemplate,
	dataNodeTemplates
} from '../../util/data-node-templates';
import {JsonValue} from '../../util/json';
import {DataNodeJsonEditor} from './data-node-json-editor';
import {JsonBuilder} from './json-builder';
import {TemplateJsonBuilder} from './json-builder/template-json-builder';

export interface DataNodeEditContentsProps {
	localText: string;
	onChangeLocalText: (text: string) => void;
	onChangeTemplate: (dataTemplate: string | undefined, text: string) => void;
	passage: Passage;
	story: Story;
}

export const DataNodeEditContents: React.FC<
	DataNodeEditContentsProps
> = props => {
	const {localText, onChangeLocalText, onChangeTemplate, passage, story} =
		props;
	const [view, setView] = React.useState<'text' | 'visual'>('visual');
	const {dispatch} = useUndoableStoriesContext();
	const {t} = useTranslation();
	const passageTags = storyPassageTags(story);
	const template = dataNodeTemplate(passage.dataTemplate);

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
		// Data nodes can't be linked to by [[links]], so there are never links to
		// update in other passages. If this node is tag-linked to passages,
		// updatePassage moves their tags to the new name itself.

		dispatch(
			updatePassage(story, passage, {name}, {dontUpdateOthers: true}),
			t('undoChange.renameDataNode')
		);
	}

	function handleSelectTemplate(id: string | undefined) {
		if (id === passage.dataTemplate) {
			return;
		}

		if (!id) {
			// Clearing the template keeps the text as-is.

			onChangeTemplate(undefined, localText);
			return;
		}

		// Auto-fill the node from its current contents: values the template knows
		// are kept, required fields are added with defaults, and the rest is
		// dropped.

		const selected = dataNodeTemplate(id)!;
		let parsed: JsonValue = {};

		try {
			parsed = JSON.parse(localText.trim() === '' ? '{}' : localText);
		} catch (error) {
			// Malformed JSON is treated as an empty node.
		}

		onChangeTemplate(
			id,
			JSON.stringify(applyTemplate(selected, parsed), null, 2)
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
				<MenuButton
					icon={<IconTemplate />}
					items={[
						{
							checkable: true,
							checked: !template,
							label: t('dialogs.dataNodeEdit.templateNone'),
							onClick: () => handleSelectTemplate(undefined)
						},
						...dataNodeTemplates.map(candidate => ({
							checkable: true as const,
							checked: template?.id === candidate.id,
							label: candidate.name,
							onClick: () => handleSelectTemplate(candidate.id)
						}))
					]}
					label={template?.name ?? t('dialogs.dataNodeEdit.template')}
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
					template={template}
					value={localText}
				/>
			) : template ? (
				<TemplateJsonBuilder
					onChange={onChangeLocalText}
					template={template}
					value={localText}
				/>
			) : (
				<JsonBuilder onChange={onChangeLocalText} value={localText} />
			)}
		</>
	);
};
