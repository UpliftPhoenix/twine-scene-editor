import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {DialogCard} from '../../components/container/dialog-card';
import {TagGrid} from '../../components/tag';
import {VisibleWhitespace} from '../../components/visible-whitespace';
import {
	Passage,
	passageWithId,
	storyWithId,
	updatePassage
} from '../../store/stories';
import {useUndoableStoriesContext} from '../../store/undoable-stories';
import {DialogComponentProps} from '../dialogs.types';
import {DataNodeEditContents} from './data-node-edit-contents';
import './data-node-edit.css';

export interface DataNodeEditDialogProps extends DialogComponentProps {
	passageId: string;
	storyId: string;
}

const InnerDataNodeEditDialog: React.FC<DataNodeEditDialogProps> = props => {
	const {passageId, storyId, ...other} = props;
	const {dispatch, stories} = useUndoableStoriesContext();
	const {t} = useTranslation();
	const passage = passageWithId(stories, storyId, passageId);
	const story = storyWithId(stories, storyId);

	// See PassageText for the rationale behind this pattern: local state keeps
	// the editors responsive, while updates to the store are debounced. Unlike
	// passage text, these updates are undoable at the app level because the
	// visual builder has no editor-level undo.

	const [localText, setLocalText] = React.useState(passage.text);
	const pendingText = React.useRef<string>();
	const pendingTimeout = React.useRef<number>();
	const changeDescription = t('undoChange.editDataNode');
	const commitText = React.useCallback(
		(text: string) => {
			dispatch(
				updatePassage(
					story,
					passage,
					{text},
					// Data nodes hold JSON, not story text, so skip link-related side
					// effects.
					{dontUpdateOthers: true}
				),
				changeDescription
			);
		},
		[changeDescription, dispatch, passage, story]
	);

	React.useEffect(() => {
		// The text has changed externally, e.g. through undo. Ignore this if a
		// change is pending so the user's typing isn't clobbered.

		if (!pendingTimeout.current && localText !== passage.text) {
			setLocalText(passage.text);
		}
	}, [localText, passage.text]);

	const handleLocalTextChange = React.useCallback(
		(text: string) => {
			// The refs must be set before local state. Calling setLocalText outside
			// a React event handler renders synchronously, and React may flush the
			// external-change effect above before this function continues--if the
			// refs weren't set yet, that effect would see no pending change and
			// revert the text just typed.

			if (pendingTimeout.current) {
				window.clearTimeout(pendingTimeout.current);
			}

			pendingText.current = text;
			pendingTimeout.current = window.setTimeout(() => {
				pendingTimeout.current = undefined;
				commitText(pendingText.current!);
			}, 1000);
			setLocalText(text);
		},
		[commitText]
	);

	// If the commit callback changes while a change is pending, re-point the
	// timeout at the current callback.

	React.useEffect(() => {
		if (pendingTimeout.current) {
			window.clearTimeout(pendingTimeout.current);
			pendingTimeout.current = window.setTimeout(() => {
				pendingTimeout.current = undefined;
				commitText(pendingText.current!);
			}, 1000);
		}
	}, [commitText]);

	return (
		<DialogCard
			{...other}
			className="data-node-edit-dialog"
			headerLabel={passage.name}
			headerDisplayLabel={
				<>
					<TagGrid tagColors={story.tagColors} tags={passage.tags} />
					<VisibleWhitespace value={passage.name} />
				</>
			}
			maximizable
		>
			<DataNodeEditContents
				localText={localText}
				onChangeLocalText={handleLocalTextChange}
				passage={passage}
				story={story}
			/>
		</DialogCard>
	);
};

export const DataNodeEditDialog: React.FC<DataNodeEditDialogProps> = props => {
	const {stories} = useUndoableStoriesContext();
	let passage: Passage | undefined;

	try {
		passage = passageWithId(stories, props.storyId, props.passageId);
	} catch (error) {
		// The node has been deleted.
	}

	// Close the dialog if the node no longer exists. This mirrors what
	// PassageEditStack does when its passages are deleted.

	if (!passage) {
		props.onClose();
		return null;
	}

	return <InnerDataNodeEditDialog {...props} />;
};
