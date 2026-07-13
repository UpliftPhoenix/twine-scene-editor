// Registers a CodeMirror lint helper for JSON documents. Unlike the
// json-lint addon that ships with CodeMirror, this doesn't require a
// `jsonlint` global. It also doesn't rely on JSON.parse error messages,
// because the position information they carry (if any) varies by JS engine.
// Instead, a minimal validating parser below reports exact error offsets.

import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';

export interface JsonLintAnnotation {
	from: CodeMirror.Position;
	to: CodeMirror.Position;
	message: string;
	severity: 'error' | 'warning';
}

interface JsonValidationError {
	message: string;
	position: number;
}

/**
 * Validates that text is well-formed JSON, returning the first error found,
 * if any. This implements the JSON grammar (https://www.json.org) without
 * building any values.
 */
export function validateJson(text: string): JsonValidationError | undefined {
	let index = 0;

	function fail(message: string): never {
		const error: JsonValidationError = {message, position: index};

		throw error;
	}

	function skipWhitespace() {
		while (' \t\n\r'.includes(text[index])) {
			index++;
		}
	}

	function parseValue() {
		skipWhitespace();

		const char = text[index];

		if (index >= text.length) {
			fail('Unexpected end of input');
		} else if (char === '{') {
			parseObject();
		} else if (char === '[') {
			parseArray();
		} else if (char === '"') {
			parseString();
		} else if (char === '-' || (char >= '0' && char <= '9')) {
			parseNumber();
		} else if (text.startsWith('true', index)) {
			index += 4;
		} else if (text.startsWith('false', index)) {
			index += 5;
		} else if (text.startsWith('null', index)) {
			index += 4;
		} else {
			fail(`Unexpected character '${char}'`);
		}
	}

	function parseObject() {
		index++;
		skipWhitespace();

		if (text[index] === '}') {
			index++;
			return;
		}

		for (;;) {
			skipWhitespace();

			if (text[index] !== '"') {
				fail('Expected a property name in double quotes');
			}

			parseString();
			skipWhitespace();

			if (text[index] !== ':') {
				fail("Expected ':' after property name");
			}

			index++;
			parseValue();
			skipWhitespace();

			if (text[index] === ',') {
				index++;
			} else if (text[index] === '}') {
				index++;
				return;
			} else {
				fail("Expected ',' or '}' in object");
			}
		}
	}

	function parseArray() {
		index++;
		skipWhitespace();

		if (text[index] === ']') {
			index++;
			return;
		}

		for (;;) {
			parseValue();
			skipWhitespace();

			if (text[index] === ',') {
				index++;
			} else if (text[index] === ']') {
				index++;
				return;
			} else {
				fail("Expected ',' or ']' in array");
			}
		}
	}

	function parseString() {
		index++;

		while (index < text.length) {
			const char = text[index];

			if (char === '"') {
				index++;
				return;
			}

			if (char === '\\') {
				const escape = text[index + 1];

				if (escape === 'u') {
					if (!/^[0-9a-fA-F]{4}/.test(text.substring(index + 2, index + 6))) {
						fail('Invalid Unicode escape sequence');
					}

					index += 6;
				} else if ('"\\/bfnrt'.includes(escape)) {
					index += 2;
				} else {
					fail('Invalid escape sequence in string');
				}
			} else if (char < ' ') {
				fail('Unescaped control character in string');
			} else {
				index++;
			}
		}

		fail('Unterminated string');
	}

	function parseNumber() {
		const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
			text.substring(index)
		);

		if (!match || match[0] === '') {
			fail('Invalid number');
		}

		index += match[0].length;
	}

	try {
		parseValue();
		skipWhitespace();

		if (index < text.length) {
			fail('Unexpected character after JSON value');
		}
	} catch (error) {
		return error as JsonValidationError;
	}

	return undefined;
}

/**
 * Converts a character offset in text to a CodeMirror position.
 */
export function positionFromOffset(
	text: string,
	offset: number
): CodeMirror.Position {
	const beforeError = text.substring(0, offset);
	const line = (beforeError.match(/\n/g) ?? []).length;
	const ch = offset - (beforeError.lastIndexOf('\n') + 1);

	return {line, ch};
}

/**
 * Returns lint annotations for JSON text. Empty documents are treated as
 * valid so that users aren't nagged before they've entered anything.
 */
export function jsonAnnotations(text: string): JsonLintAnnotation[] {
	if (text.trim() === '') {
		return [];
	}

	const error = validateJson(text);

	if (!error) {
		return [];
	}

	const from = positionFromOffset(text, Math.min(error.position, text.length));

	return [
		{
			from,
			to: {line: from.line, ch: from.ch + 1},
			message: error.message,
			severity: 'error'
		}
	];
}

let inited = false;

export function initJsonLintGlobally() {
	if (!inited) {
		CodeMirror.registerHelper('lint', 'json', jsonAnnotations);
		inited = true;
	}
}
