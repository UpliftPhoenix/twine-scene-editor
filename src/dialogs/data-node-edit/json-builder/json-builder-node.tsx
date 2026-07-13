import {IconPlus, IconX} from '@tabler/icons';
import classNames from 'classnames';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../components/control/icon-button';
import {MenuButton} from '../../../components/control/menu-button';
import {JSON_TYPE_DRAG_TYPE} from './json-builder-palette';
import {
	AddableJsonType,
	addableJsonTypes,
	JsonObject,
	JsonPath,
	JsonValue,
	jsonValueType
} from './json-builder-utils';

export interface JsonBuilderNodeProps {
	onAppend: (containerPath: JsonPath, type: AddableJsonType) => void;
	onRemove: (path: JsonPath) => void;
	onRenameKey: (containerPath: JsonPath, oldKey: string, newKey: string) => void;
	onSetValue: (path: JsonPath, value: JsonValue) => void;
	path: JsonPath;
	value: JsonValue;
}

/**
 * An editor for an object key name. Edits are kept local until they're
 * committed by blurring or pressing Enter, since renaming a key mid-typing
 * would re-order or clobber other entries.
 */
const JsonBuilderKeyInput: React.FC<{
	container: JsonObject;
	onRename: (oldKey: string, newKey: string) => void;
	value: string;
}> = ({container, onRename, value}) => {
	const [draft, setDraft] = React.useState(value);
	const {t} = useTranslation();

	React.useEffect(() => setDraft(value), [value]);

	const invalid = draft !== value && (draft.trim() === '' || draft in container);

	function commit() {
		if (draft !== value) {
			if (invalid) {
				setDraft(value);
			} else {
				onRename(value, draft);
			}
		}
	}

	return (
		<input
			aria-label={t('dialogs.dataNodeEdit.builder.keyLabel')}
			className={classNames('json-builder-key', {invalid})}
			onBlur={commit}
			onChange={event => setDraft(event.target.value)}
			onKeyDown={event => {
				if (event.key === 'Enter') {
					event.preventDefault();
					commit();
				}
			}}
			spellCheck={false}
			type="text"
			value={draft}
		/>
	);
};

/**
 * An editor for a number value. Edits are kept local while the text isn't a
 * valid number (e.g. `1e` on the way to `1e5`), and committed as soon as it
 * is.
 */
const JsonBuilderNumberInput: React.FC<{
	onChange: (value: number) => void;
	value: number;
}> = ({onChange, value}) => {
	const [draft, setDraft] = React.useState(String(value));
	const {t} = useTranslation();

	React.useEffect(() => {
		setDraft(draft =>
			draft.trim() !== '' && Number(draft) === value ? draft : String(value)
		);
	}, [value]);

	function handleChange(text: string) {
		setDraft(text);

		if (text.trim() !== '' && Number.isFinite(Number(text))) {
			onChange(Number(text));
		}
	}

	return (
		<input
			aria-label={t('dialogs.dataNodeEdit.builder.numberLabel')}
			className={classNames('json-builder-number', {
				invalid: draft.trim() === '' || !Number.isFinite(Number(draft))
			})}
			inputMode="decimal"
			onBlur={() => setDraft(String(value))}
			onChange={event => handleChange(event.target.value)}
			spellCheck={false}
			type="text"
			value={draft}
		/>
	);
};

const AddValueButton: React.FC<{
	onAdd: (type: AddableJsonType) => void;
}> = ({onAdd}) => {
	const {t} = useTranslation();

	return (
		<MenuButton
			icon={<IconPlus />}
			items={addableJsonTypes.map(type => ({
				label: t(`dialogs.dataNodeEdit.builder.types.${type}`),
				onClick: () => onAdd(type)
			}))}
			label={t('common.add')}
		/>
	);
};

export const JsonBuilderNode: React.FC<JsonBuilderNodeProps> = props => {
	const {onAppend, onRemove, onRenameKey, onSetValue, path, value} = props;
	const [dropTarget, setDropTarget] = React.useState(false);
	const {t} = useTranslation();
	const type = jsonValueType(value);

	function handleDragOver(event: React.DragEvent) {
		if (event.dataTransfer.types.includes(JSON_TYPE_DRAG_TYPE)) {
			event.preventDefault();
			event.stopPropagation();
			event.dataTransfer.dropEffect = 'copy';
			setDropTarget(true);
		}
	}

	function handleDragLeave() {
		setDropTarget(false);
	}

	function handleDrop(event: React.DragEvent) {
		const droppedType = event.dataTransfer.getData(
			JSON_TYPE_DRAG_TYPE
		) as AddableJsonType;

		if (addableJsonTypes.includes(droppedType)) {
			event.preventDefault();
			event.stopPropagation();
			onAppend(path, droppedType);
		}

		setDropTarget(false);
	}

	switch (type) {
		case 'string':
			return (
				<input
					aria-label={t('dialogs.dataNodeEdit.builder.stringLabel')}
					className="json-builder-string"
					onChange={event => onSetValue(path, event.target.value)}
					spellCheck={false}
					type="text"
					value={value as string}
				/>
			);

		case 'number':
			return (
				<JsonBuilderNumberInput
					onChange={newValue => onSetValue(path, newValue)}
					value={value as number}
				/>
			);

		case 'boolean':
			return (
				<select
					aria-label={t('dialogs.dataNodeEdit.builder.booleanLabel')}
					className="json-builder-boolean"
					onChange={event => onSetValue(path, event.target.value === 'true')}
					value={String(value)}
				>
					<option value="true">true</option>
					<option value="false">false</option>
				</select>
			);

		case 'null':
			return <span className="json-builder-null">null</span>;

		case 'array':
		case 'object': {
			const isArray = type === 'array';
			const entries: [string | number, JsonValue][] = isArray
				? (value as JsonValue[]).map((item, index) => [index, item])
				: Object.entries(value as JsonObject);

			return (
				<div
					className={classNames('json-builder-container', type, {
						'drop-target': dropTarget
					})}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					<div className="json-builder-container-header">
						<span className="json-builder-type-badge">
							{t(`dialogs.dataNodeEdit.builder.types.${type}`)}
						</span>
						<span className="json-builder-count">
							{t('dialogs.dataNodeEdit.builder.itemCount', {
								count: entries.length
							})}
						</span>
					</div>
					{entries.length === 0 && (
						<div className="json-builder-empty">
							{t('dialogs.dataNodeEdit.builder.dropHint')}
						</div>
					)}
					{entries.map(([key, item]) => (
						<div className="json-builder-row" key={key}>
							{isArray ? (
								<span className="json-builder-index">{key}</span>
							) : (
								<JsonBuilderKeyInput
									container={value as JsonObject}
									onRename={(oldKey, newKey) =>
										onRenameKey(path, oldKey, newKey)
									}
									value={key as string}
								/>
							)}
							<JsonBuilderNode
								onAppend={onAppend}
								onRemove={onRemove}
								onRenameKey={onRenameKey}
								onSetValue={onSetValue}
								path={[...path, key]}
								value={item}
							/>
							<IconButton
								icon={<IconX />}
								iconOnly
								label={t('common.remove')}
								onClick={() => onRemove([...path, key])}
							/>
						</div>
					))}
					<div className="json-builder-container-footer">
						<AddValueButton onAdd={addType => onAppend(path, addType)} />
					</div>
				</div>
			);
		}
	}

	return null;
};
