import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {DialogEditor} from '../../components/container/dialog-card';
import {CodeArea} from '../../components/control/code-area';
import {initJsonLintGlobally} from '../../codemirror/json-lint';
import {usePrefsContext} from '../../store/prefs';
import {Passage} from '../../store/stories';
import {codeMirrorOptionsFromPrefs} from '../../util/codemirror-options';

// As in code-area.tsx, CodeMirror must be configured before the first render
// so it picks up the lint helper properly.

initJsonLintGlobally();

export interface DataNodeJsonEditorProps {
	onChangeText: (value: string) => void;
	passage: Passage;
	value: string;
}

/**
 * A monospaced, JSON-linted text editor for a data node's contents.
 * Debouncing of changes is handled by the parent dialog, so `onChangeText`
 * is called on every change.
 */
export const DataNodeJsonEditor: React.FC<DataNodeJsonEditorProps> = props => {
	const {onChangeText, passage, value} = props;
	const {prefs} = usePrefsContext();
	const {t} = useTranslation();

	const handleMount = React.useCallback((editor: CodeMirror.Editor) => {
		// The dialog entrance animation can interfere with CodeMirror's cursor
		// rendering. This runs after the animation completes.

		window.setTimeout(() => {
			editor.focus();
			editor.refresh();
		}, 400);
	}, []);

	const options = React.useMemo(
		() => ({
			...codeMirrorOptionsFromPrefs(prefs),
			gutters: ['CodeMirror-lint-markers'],
			lineNumbers: true,
			lineWrapping: true,
			lint: true,
			mode: {name: 'javascript', json: true},
			placeholder: t('dialogs.dataNodeEdit.jsonPlaceholder')
		}),
		[prefs, t]
	);

	return (
		<DialogEditor>
			<CodeArea
				editorDidMount={handleMount}
				fontFamily={prefs.codeEditorFontFamily}
				fontScale={prefs.codeEditorFontScale}
				id={`data-node-json-code-area-${passage.id}`}
				label={t('dialogs.dataNodeEdit.editorLabel')}
				labelHidden
				onChangeText={onChangeText}
				options={options}
				useCodeMirror={prefs.useCodeMirror}
				value={value}
			/>
		</DialogEditor>
	);
};
