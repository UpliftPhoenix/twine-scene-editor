// Data node templates: named schemas that pre-fill a data node's JSON and
// constrain which fields it may contain. A node's chosen template is stored
// in its `dataTemplate` field. In the text editor, violations surface as lint
// annotations; in the visual builder, the template replaces the free-form
// builder with fixed rows where only optional fields can be toggled.
//
// Validation messages here are plain English rather than localized strings,
// matching the JSON lint messages in codemirror/json-lint.ts.

import {JsonObject, JsonPath, JsonValue} from './json';

interface DataTemplateFieldBase {
	/**
	 * Object key this field occupies.
	 */
	name: string;
	/**
	 * Optional fields are only present when the user toggles them on.
	 */
	optional?: boolean;
	/**
	 * If set, this field may only be present while a sibling field equals a
	 * value.
	 */
	requires?: {equals: JsonValue; field: string};
}

export interface DataTemplateStringField extends DataTemplateFieldBase {
	default?: string;
	type: 'string';
}

export interface DataTemplateNumberField extends DataTemplateFieldBase {
	default?: number;
	/**
	 * Inclusive bounds.
	 */
	max?: number;
	min?: number;
	type: 'number';
}

export interface DataTemplateBooleanField extends DataTemplateFieldBase {
	default?: boolean;
	type: 'boolean';
}

export interface DataTemplateObjectField extends DataTemplateFieldBase {
	fields: DataTemplateField[];
	type: 'object';
}

export type DataTemplateField =
	| DataTemplateStringField
	| DataTemplateNumberField
	| DataTemplateBooleanField
	| DataTemplateObjectField;

export interface DataNodeTemplate {
	/**
	 * Editable fields, in display order.
	 */
	fields: DataTemplateField[];
	/**
	 * Stable identifier persisted with passages. Don't change existing IDs, or
	 * saved stories will lose their template assignment.
	 */
	id: string;
	/**
	 * Display name shown in the template menu.
	 */
	name: string;
	/**
	 * Values invisibly merged into the node's data when the story is exported
	 * to JSON. They never appear in the editor and override user data with the
	 * same keys.
	 */
	silentValues: JsonObject;
}

export const dataNodeTemplates: DataNodeTemplate[] = [
	{
		id: 'item-reward',
		name: 'Item Reward',
		silentValues: {},
		fields: [
			{name: 'category', type: 'string', default: ''},
			{name: 'kind', type: 'string', default: ''},
			{name: 'amount', type: 'number', optional: true, default: 1, min: 1},
			{
				name: 'properties',
				type: 'object',
				optional: true,
				requires: {field: 'category', equals: 'pets'},
				fields: [
					{name: 'age', type: 'number', optional: true, default: 1, min: 1, max: 6},
					{name: 'neon', type: 'boolean', optional: true, default: true},
					{name: 'mega_neon', type: 'boolean', optional: true, default: true}
				]
			}
		]
	},
	{
		id: 'currency-reward',
		name: 'Currency Reward',
		silentValues: {category: 'currency'},
		fields: [
			{name: 'kind', type: 'string', default: ''},
			{name: 'amount', type: 'number', default: 1, min: 1}
		]
	}
];

/**
 * Looks up a template by ID, e.g. a passage's `dataTemplate` field. Returns
 * undefined for undefined or unknown IDs, so callers degrade gracefully if a
 * template is ever removed.
 */
export function dataNodeTemplate(
	id: string | undefined
): DataNodeTemplate | undefined {
	return dataNodeTemplates.find(template => template.id === id);
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesFieldType(field: DataTemplateField, value: JsonValue | undefined) {
	switch (field.type) {
		case 'string':
			return typeof value === 'string';
		case 'number':
			return typeof value === 'number';
		case 'boolean':
			return typeof value === 'boolean';
		case 'object':
			return isJsonObject(value);
	}
}

/**
 * Returns the value a field starts with when it's filled in or toggled on.
 * Object fields start with their required subfields, recursively.
 */
export function templateFieldDefault(field: DataTemplateField): JsonValue {
	switch (field.type) {
		case 'string':
			return field.default ?? '';
		case 'number':
			return field.default ?? field.min ?? 0;
		case 'boolean':
			return field.default ?? false;
		case 'object':
			return applyTemplateFields(field.fields, undefined);
	}
}

function applyTemplateFields(
	fields: DataTemplateField[],
	existing: JsonObject | undefined
): JsonObject {
	const result: JsonObject = {};

	for (const field of fields) {
		const existingValue = existing?.[field.name];

		if (matchesFieldType(field, existingValue)) {
			result[field.name] =
				field.type === 'object'
					? applyTemplateFields(field.fields, existingValue as JsonObject)
					: (existingValue as JsonValue);
		} else if (!field.optional) {
			result[field.name] = templateFieldDefault(field);
		}
	}

	// Drop optional fields whose requirement isn't met by the merged result.

	for (const field of fields) {
		if (
			field.optional &&
			field.requires &&
			field.name in result &&
			result[field.requires.field] !== field.requires.equals
		) {
			delete result[field.name];
		}
	}

	return result;
}

/**
 * Auto-fills a value to conform to a template: required fields are added with
 * their defaults, existing values are kept where the template has a matching
 * field of the same type, and everything else is dropped.
 */
export function applyTemplate(
	template: DataNodeTemplate,
	value: JsonValue
): JsonObject {
	return applyTemplateFields(
		template.fields,
		isJsonObject(value) ? value : undefined
	);
}

export interface DataTemplateError {
	message: string;
	/**
	 * Path to the offending value. For a missing field, this is the path of
	 * the object it's missing from.
	 */
	path: JsonPath;
}

function fieldTypeName(field: DataTemplateField) {
	return field.type === 'object' ? 'an object' : `a ${field.type}`;
}

function validateFields(
	fields: DataTemplateField[],
	container: JsonObject,
	path: JsonPath,
	template: DataNodeTemplate,
	errors: DataTemplateError[]
) {
	for (const field of fields) {
		const value = container[field.name];
		const fieldPath = [...path, field.name];

		if (value === undefined) {
			if (!field.optional) {
				errors.push({
					message: `Missing required field "${field.name}"`,
					path
				});
			}

			continue;
		}

		if (
			field.requires &&
			container[field.requires.field] !== field.requires.equals
		) {
			errors.push({
				message: `"${field.name}" is only allowed when "${
					field.requires.field
				}" is ${JSON.stringify(field.requires.equals)}`,
				path: fieldPath
			});
		}

		if (!matchesFieldType(field, value)) {
			errors.push({
				message: `"${field.name}" must be ${fieldTypeName(field)}`,
				path: fieldPath
			});
			continue;
		}

		if (field.type === 'number') {
			const number = value as number;

			if (field.min !== undefined && number < field.min) {
				errors.push({
					message: `"${field.name}" must be at least ${field.min}`,
					path: fieldPath
				});
			} else if (field.max !== undefined && number > field.max) {
				errors.push({
					message: `"${field.name}" must be at most ${field.max}`,
					path: fieldPath
				});
			}
		} else if (field.type === 'object') {
			validateFields(field.fields, value as JsonObject, fieldPath, template, errors);
		}
	}

	const known = new Set(fields.map(field => field.name));

	for (const key of Object.keys(container)) {
		if (known.has(key)) {
			continue;
		}

		if (path.length === 0 && key in template.silentValues) {
			errors.push({
				message: `"${key}" is added automatically by the ${template.name} template at export`,
				path: [key]
			});
		} else {
			errors.push({
				message: `"${key}" isn't part of the ${template.name} template`,
				path: [...path, key]
			});
		}
	}
}

/**
 * Checks a value against a template, returning all problems found. An empty
 * array means the value conforms.
 */
export function validateTemplateValue(
	template: DataNodeTemplate,
	root: JsonValue
): DataTemplateError[] {
	if (!isJsonObject(root)) {
		return [
			{message: `${template.name} data must be a JSON object`, path: []}
		];
	}

	const errors: DataTemplateError[] = [];

	validateFields(template.fields, root, [], template, errors);
	return errors;
}

/**
 * Returns a data node's parsed data with the template's silent values merged
 * in, for export. Silent values win over user data with the same keys.
 */
export function mergeSilentValues(
	template: DataNodeTemplate,
	data: unknown
): unknown {
	if (Object.keys(template.silentValues).length === 0) {
		return data;
	}

	if (!isJsonObject(data as JsonValue)) {
		return data;
	}

	return {...(data as JsonObject), ...template.silentValues};
}
