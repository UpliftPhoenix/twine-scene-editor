// Generic JSON value types shared by the data node editor, data node
// templates, and export code.

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
