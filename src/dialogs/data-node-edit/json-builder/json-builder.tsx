import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {JsonBuilderNode} from './json-builder-node';
import {JsonBuilderPalette} from './json-builder-palette';
import {
	AddableJsonType,
	appendJsonValue,
	JsonPath,
	JsonValue,
	removeJsonValueAtPath,
	renameJsonKey,
	setJsonValueAtPath
} from './json-builder-utils';
import './json-builder.css';

export interface JsonBuilderProps {
	/**
	 * Called with the new JSON text whenever an edit is made in the builder.
	 */
	onChange: (text: string) => void;
	/**
	 * Current JSON text. Blank text is treated as an empty object.
	 */
	value: string;
}

/**
 * A visual editor for JSON data. Values can be added by dragging type chips
 * from the palette onto objects and arrays in the canvas (or with their add
 * buttons), edited inline, and nested arbitrarily deep.
 */
export const JsonBuilder: React.FC<JsonBuilderProps> = props => {
	const {onChange, value} = props;
	const {t} = useTranslation();
	const parsed = React.useMemo<{root: JsonValue} | {error: Error}>(() => {
		try {
			return {root: JSON.parse(value.trim() === '' ? '{}' : value)};
		} catch (error) {
			return {error: error as Error};
		}
	}, [value]);

	if ('error' in parsed) {
		return (
			<div className="json-builder">
				<div className="json-builder-invalid">
					<p>{t('dialogs.dataNodeEdit.builder.invalidJson')}</p>
					<p className="json-builder-invalid-detail">{parsed.error.message}</p>
				</div>
			</div>
		);
	}

	const {root} = parsed;

	function emitRoot(newRoot: JsonValue) {
		onChange(JSON.stringify(newRoot, null, 2));
	}

	function handleAppend(containerPath: JsonPath, type: AddableJsonType) {
		emitRoot(appendJsonValue(root, containerPath, type));
	}

	function handleRemove(path: JsonPath) {
		emitRoot(removeJsonValueAtPath(root, path));
	}

	function handleRenameKey(
		containerPath: JsonPath,
		oldKey: string,
		newKey: string
	) {
		emitRoot(renameJsonKey(root, containerPath, oldKey, newKey));
	}

	function handleSetValue(path: JsonPath, newValue: JsonValue) {
		emitRoot(setJsonValueAtPath(root, path, newValue));
	}

	return (
		<div className="json-builder">
			<div className="json-builder-toolbar">
				<JsonBuilderPalette />
			</div>
			<div className="json-builder-canvas">
				<JsonBuilderNode
					onAppend={handleAppend}
					onRemove={handleRemove}
					onRenameKey={handleRenameKey}
					onSetValue={handleSetValue}
					path={[]}
					value={root}
				/>
			</div>
		</div>
	);
};
