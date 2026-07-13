// Model helpers for the visual JSON builder. All update functions are
// immutable--they return a new root value and never mutate their input, so
// results can flow directly into React state.

export interface JsonObject {
	[key: string]: JsonValue;
}

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| JsonObject;

/**
 * A path from the root value to a nested value: object keys and array
 * indexes. An empty path is the root itself.
 */
export type JsonPath = (string | number)[];

export type JsonValueType =
	| 'array'
	| 'boolean'
	| 'null'
	| 'number'
	| 'object'
	| 'string';

/**
 * Types that can be added by users in the builder. `null` can only enter a
 * data node through the text editor.
 */
export const addableJsonTypes = [
	'string',
	'number',
	'boolean',
	'object',
	'array'
] as const;

export type AddableJsonType = typeof addableJsonTypes[number];

export function jsonValueType(value: JsonValue): JsonValueType {
	if (value === null) {
		return 'null';
	}

	if (Array.isArray(value)) {
		return 'array';
	}

	return typeof value as 'boolean' | 'number' | 'object' | 'string';
}

/**
 * Returns the initial value a newly-added value of a type has.
 */
export function defaultJsonValue(type: AddableJsonType): JsonValue {
	switch (type) {
		case 'array':
			return [];
		case 'boolean':
			return false;
		case 'number':
			return 0;
		case 'object':
			return {};
		case 'string':
			return '';
	}
}

function cloneJsonContainer(value: JsonValue): JsonValue[] | JsonObject {
	if (Array.isArray(value)) {
		return [...value];
	}

	if (value !== null && typeof value === 'object') {
		return {...value};
	}

	throw new Error(`Tried to descend into a non-container JSON value`);
}

export function getJsonValueAtPath(root: JsonValue, path: JsonPath): JsonValue {
	return path.reduce<JsonValue>((value, step) => {
		if (value === null || typeof value !== 'object') {
			throw new Error(`Path step "${step}" doesn't exist in this value`);
		}

		return (value as JsonObject)[step as string];
	}, root);
}

/**
 * Returns a new root with the value at a path replaced. An empty path
 * replaces the root itself.
 */
export function setJsonValueAtPath(
	root: JsonValue,
	path: JsonPath,
	value: JsonValue
): JsonValue {
	if (path.length === 0) {
		return value;
	}

	const [step, ...rest] = path;
	const clone = cloneJsonContainer(root);

	(clone as JsonObject)[step as string] = setJsonValueAtPath(
		(clone as JsonObject)[step as string],
		rest,
		value
	);
	return clone;
}

/**
 * Returns a new root with the value at a path removed. Removing an array item
 * shifts later items down.
 */
export function removeJsonValueAtPath(
	root: JsonValue,
	path: JsonPath
): JsonValue {
	if (path.length === 0) {
		throw new Error("The root value can't be removed");
	}

	const containerPath = path.slice(0, -1);
	const step = path[path.length - 1];
	const container = getJsonValueAtPath(root, containerPath);

	if (Array.isArray(container)) {
		return setJsonValueAtPath(
			root,
			containerPath,
			container.filter((_, index) => index !== step)
		);
	}

	const clone = {...(container as JsonObject)};

	delete clone[step as string];
	return setJsonValueAtPath(root, containerPath, clone);
}

/**
 * Returns an object key not already in use, based on `key`, then `key 2`,
 * `key 3`, and so on.
 */
export function unusedJsonKey(container: JsonObject, base = 'key') {
	if (!(base in container)) {
		return base;
	}

	let counter = 2;

	while (`${base} ${counter}` in container) {
		counter++;
	}

	return `${base} ${counter}`;
}

/**
 * Returns a new root with a default value of a type appended to the container
 * at a path. Objects get an automatically-generated key.
 */
export function appendJsonValue(
	root: JsonValue,
	containerPath: JsonPath,
	type: AddableJsonType
): JsonValue {
	const container = getJsonValueAtPath(root, containerPath);
	const value = defaultJsonValue(type);

	if (Array.isArray(container)) {
		return setJsonValueAtPath(root, containerPath, [...container, value]);
	}

	if (container !== null && typeof container === 'object') {
		return setJsonValueAtPath(root, containerPath, {
			...container,
			[unusedJsonKey(container)]: value
		});
	}

	throw new Error('Values can only be added to objects and arrays');
}

/**
 * Returns a new root with an object key renamed, preserving the position of
 * the entry. If the new key already exists, the root is returned unchanged.
 */
export function renameJsonKey(
	root: JsonValue,
	containerPath: JsonPath,
	oldKey: string,
	newKey: string
): JsonValue {
	const container = getJsonValueAtPath(root, containerPath);

	if (
		container === null ||
		typeof container !== 'object' ||
		Array.isArray(container)
	) {
		throw new Error('Only object keys can be renamed');
	}

	if (oldKey === newKey || newKey in container) {
		return root;
	}

	const renamed = Object.keys(container).reduce<JsonObject>((result, key) => {
		result[key === oldKey ? newKey : key] = container[key];
		return result;
	}, {});

	return setJsonValueAtPath(root, containerPath, renamed);
}
