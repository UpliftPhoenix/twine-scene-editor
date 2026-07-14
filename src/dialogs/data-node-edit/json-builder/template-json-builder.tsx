import {IconPlus, IconX} from '@tabler/icons';
import classNames from 'classnames';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../components/control/icon-button';
import {
	DataNodeTemplate,
	DataTemplateArrayItem,
	DataTemplateField,
	templateFieldDefault,
	templateFieldEnum,
	templateRequirementMet,
	validateTemplateValue
} from '../../../util/data-node-templates';
import {JsonObject, JsonPath, JsonValue} from '../../../util/json';
import {JsonBuilderNode} from './json-builder-node';
import {removeJsonValueAtPath, setJsonValueAtPath} from './json-builder-utils';
import './json-builder.css';

export interface TemplateJsonBuilderProps {
	/**
	 * Called with the new JSON text whenever an edit is made.
	 */
	onChange: (text: string) => void;
	/**
	 * Template the node follows. Its fields define the rows shown.
	 */
	template: DataNodeTemplate;
	/**
	 * Current JSON text. Blank text is treated as an empty object.
	 */
	value: string;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pathKey(path: JsonPath) {
	return JSON.stringify(path);
}

/**
 * A human-readable rendering of a number field's bounds, e.g. `≥ 1` or
 * `1–6`. Returns undefined for unbounded fields.
 */
function numberBounds(field: DataTemplateField | DataTemplateArrayItem) {
	if (field.type !== 'number') {
		return undefined;
	}

	if (field.min !== undefined && field.max !== undefined) {
		return `${field.min}–${field.max}`;
	}

	if (field.min !== undefined) {
		return `≥ ${field.min}`;
	}

	if (field.max !== undefined) {
		return `≤ ${field.max}`;
	}

	return undefined;
}

const noop = () => {};

interface TemplateValueProps {
	/**
	 * Object the value lives in, used to resolve conditional enums. Array
	 * items have none.
	 */
	container?: JsonObject;
	errorsByPath: Map<string, string>;
	/**
	 * Template the value must follow: a field, or an array's item template.
	 */
	field: DataTemplateField | DataTemplateArrayItem;
	onRemoveValue: (path: JsonPath) => void;
	onSetValue: (path: JsonPath, value: JsonValue) => void;
	/**
	 * Path of the value itself.
	 */
	path: JsonPath;
	value: JsonValue;
}

/**
 * The editor for a single templated value: fixed rows for objects, an
 * add/remove item list for arrays, a dropdown for enum strings, and an inline
 * input for everything else. Shared between template field rows and array
 * items.
 */
const TemplateValue: React.FC<TemplateValueProps> = props => {
	const {container, errorsByPath, field, onRemoveValue, onSetValue, path, value} =
		props;
	const {t} = useTranslation();

	if (field.type === 'object' && isJsonObject(value)) {
		return (
			<div className="json-builder-container template-builder-container">
				{field.fields.map(subfield => (
					<TemplateFieldRow
						container={value}
						errorsByPath={errorsByPath}
						field={subfield}
						key={subfield.name}
						onRemoveValue={onRemoveValue}
						onSetValue={onSetValue}
						path={path}
					/>
				))}
			</div>
		);
	}

	if (field.type === 'array' && Array.isArray(value)) {
		const itemBounds = numberBounds(field.item);

		return (
			<div className="json-builder-container template-builder-container">
				{value.map((item, index) => {
					const itemPath = [...path, index];
					const itemError = errorsByPath.get(pathKey(itemPath));

					return (
						<div
							className="json-builder-row template-builder-item"
							key={index}
						>
							<span className="json-builder-index">{index + 1}</span>
							<TemplateValue
								errorsByPath={errorsByPath}
								field={field.item}
								onRemoveValue={onRemoveValue}
								onSetValue={onSetValue}
								path={itemPath}
								value={item}
							/>
							{itemBounds && (
								<span className="template-builder-range">{itemBounds}</span>
							)}
							{itemError && (
								<span className="template-builder-error">{itemError}</span>
							)}
							<IconButton
								icon={<IconX />}
								iconOnly
								label={t('common.remove')}
								onClick={() => onRemoveValue(itemPath)}
							/>
						</div>
					);
				})}
				<div className="template-builder-add-item">
					<IconButton
						icon={<IconPlus />}
						label={t('dialogs.dataNodeEdit.builder.addItem')}
						onClick={() =>
							onSetValue([...path, value.length], templateFieldDefault(field.item))
						}
					/>
				</div>
			</div>
		);
	}

	const enumOptions =
		field.type === 'string' ? templateFieldEnum(field, container) : undefined;

	if (enumOptions && typeof value === 'string') {
		return (
			<select
				aria-label={t('dialogs.dataNodeEdit.builder.stringLabel')}
				className="json-builder-enum"
				onChange={event => onSetValue(path, event.target.value)}
				value={value}
			>
				{/*
				A value outside the allowed set (e.g. typed in the text view)
				still has to render as the select's current value. Validation
				flags it alongside.
				*/}
				{!enumOptions.includes(value) && <option value={value}>{value}</option>}
				{enumOptions.map(option => (
					<option key={option} value={option}>
						{option}
					</option>
				))}
			</select>
		);
	}

	return (
		<JsonBuilderNode
			onAppend={noop}
			onRemove={noop}
			onRenameKey={noop}
			onSetValue={onSetValue}
			path={path}
			value={value}
		/>
	);
};

interface TemplateFieldRowProps {
	container: JsonObject;
	errorsByPath: Map<string, string>;
	field: DataTemplateField;
	onRemoveValue: (path: JsonPath) => void;
	onSetValue: (path: JsonPath, value: JsonValue) => void;
	/**
	 * Path of the object containing this field.
	 */
	path: JsonPath;
}

const TemplateFieldRow: React.FC<TemplateFieldRowProps> = props => {
	const {container, errorsByPath, field, onRemoveValue, onSetValue, path} =
		props;
	const {t} = useTranslation();
	const value = container[field.name];
	const present = value !== undefined;
	const fieldPath = [...path, field.name];
	const requirementMet =
		!field.requires || templateRequirementMet(field.requires, container);
	const error = errorsByPath.get(pathKey(fieldPath));
	const bounds = numberBounds(field);

	function handleToggle() {
		if (present) {
			onRemoveValue(fieldPath);
		} else {
			onSetValue(fieldPath, templateFieldDefault(field, container));
		}
	}

	return (
		<div
			className={classNames('json-builder-row', 'template-builder-row', {
				'template-builder-missing': !field.optional && !present
			})}
		>
			<input
				aria-label={t('dialogs.dataNodeEdit.builder.includeField', {
					name: field.name
				})}
				checked={present}
				className="template-builder-toggle"
				disabled={
					// Required fields can't be removed; optional fields with an unmet
					// requirement can't be added (but can still be removed if they're
					// somehow present).
					(present && !field.optional) || (!present && !requirementMet)
				}
				onChange={handleToggle}
				type="checkbox"
			/>
			<span className="template-builder-key">{field.name}</span>
			{present ? (
				<TemplateValue
					container={container}
					errorsByPath={errorsByPath}
					field={field}
					onRemoveValue={onRemoveValue}
					onSetValue={onSetValue}
					path={fieldPath}
					value={value}
				/>
			) : (
				<span className="template-builder-hint">
					{!requirementMet && field.requires
						? 'equals' in field.requires
							? t('dialogs.dataNodeEdit.builder.requiresHint', {
									field: field.requires.field,
									value: JSON.stringify(field.requires.equals)
							  })
							: t('dialogs.dataNodeEdit.builder.requiresNotEqualHint', {
									field: field.requires.field,
									value: JSON.stringify(field.requires.notEqual)
							  })
						: t(
								field.optional
									? 'dialogs.dataNodeEdit.builder.notIncluded'
									: 'dialogs.dataNodeEdit.builder.missingRequired'
						  )}
				</span>
			)}
			{present && bounds && (
				<span className="template-builder-range">{bounds}</span>
			)}
			{error && <span className="template-builder-error">{error}</span>}
		</div>
	);
};

/**
 * A visual editor for a data node that follows a template. Instead of the
 * free-form builder, this shows one row per template field: keys are fixed,
 * values are edited inline, and optional fields are toggled on and off with a
 * checkbox. Toggling a field on slots in its default value from the template.
 */
export const TemplateJsonBuilder: React.FC<TemplateJsonBuilderProps> = props => {
	const {onChange, template, value} = props;
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

	if (!isJsonObject(root)) {
		return (
			<div className="json-builder">
				<div className="json-builder-invalid">
					<p>{t('dialogs.dataNodeEdit.builder.templateNotObject')}</p>
				</div>
			</div>
		);
	}

	const errorsByPath = new Map(
		validateTemplateValue(template, root).map(error => [
			pathKey(error.path),
			error.message
		])
	);

	function emitRoot(newRoot: JsonValue) {
		onChange(JSON.stringify(newRoot, null, 2));
	}

	function handleRemoveValue(path: JsonPath) {
		emitRoot(removeJsonValueAtPath(root, path));
	}

	function handleSetValue(path: JsonPath, newValue: JsonValue) {
		emitRoot(setJsonValueAtPath(root, path, newValue));
	}

	// Fields the template doesn't know about, e.g. typed into the text view.
	// They can't be edited here, only removed.

	const knownFields = new Set(template.fields.map(field => field.name));
	const unknownKeys = Object.keys(root).filter(key => !knownFields.has(key));

	return (
		<div className="json-builder template-builder">
			<div className="json-builder-canvas">
				<div className="template-builder-rows">
					{template.fields.map(field => (
						<TemplateFieldRow
							container={root}
							errorsByPath={errorsByPath}
							field={field}
							key={field.name}
							onRemoveValue={handleRemoveValue}
							onSetValue={handleSetValue}
							path={[]}
						/>
					))}
					{unknownKeys.map(key => (
						<div
							className="json-builder-row template-builder-row template-builder-unknown"
							key={key}
						>
							<span className="template-builder-key">{key}</span>
							<code className="template-builder-unknown-value">
								{JSON.stringify(root[key])}
							</code>
							<span className="template-builder-error">
								{errorsByPath.get(pathKey([key])) ??
									t('dialogs.dataNodeEdit.builder.notInTemplate')}
							</span>
							<IconButton
								icon={<IconX />}
								iconOnly
								label={t('common.remove')}
								onClick={() => handleRemoveValue([key])}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
