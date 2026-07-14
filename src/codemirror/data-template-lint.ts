// Lint annotations for data node templates. These run alongside the JSON
// syntax lint in json-lint.ts: once text parses as JSON, violations of the
// node's template (missing or unknown fields, wrong types, broken
// constraints) are reported as errors, anchored at the offending key when it
// can be located in the text.

import {
	DataNodeTemplate,
	DataTemplateError,
	validateTemplateValue
} from '../util/data-node-templates';
import {JsonValue} from '../util/json';
import {JsonLintAnnotation, positionFromOffset} from './json-lint';

/**
 * Finds the character offset and length of the key an error's path points at,
 * by searching for each path step's quoted key in order. This is a
 * heuristic--it can be fooled by string values that look like keys--but
 * template documents are small and regular enough that it lands correctly in
 * practice. Array indexes can't be located this way, so they're skipped and
 * the error anchors at the nearest named key. Returns undefined if a step
 * can't be found.
 */
function offsetOfPath(text: string, error: DataTemplateError) {
	let offset = 0;
	let found: {index: number; length: number} | undefined = undefined;

	for (const step of error.path) {
		if (typeof step === 'number') {
			continue;
		}

		const key = JSON.stringify(step);
		const index = text.indexOf(key, offset);

		if (index === -1) {
			return undefined;
		}

		found = {index, length: key.length};
		offset = index + 1;
	}

	return found;
}

/**
 * Returns lint annotations for template violations in JSON text. Text that
 * doesn't parse returns no annotations--the JSON syntax lint reports those
 * errors with better positions.
 */
export function templateAnnotations(
	text: string,
	template: DataNodeTemplate
): JsonLintAnnotation[] {
	let root: JsonValue;

	try {
		root = JSON.parse(text.trim() === '' ? '{}' : text);
	} catch (error) {
		return [];
	}

	return validateTemplateValue(template, root).map(error => {
		const anchor = offsetOfPath(text, error);
		const from =
			anchor !== undefined
				? positionFromOffset(text, anchor.index)
				: {line: 0, ch: 0};
		const length = anchor !== undefined ? anchor.length : 1;

		return {
			from,
			to: {line: from.line, ch: from.ch + length},
			message: error.message,
			severity: 'error' as const
		};
	});
}
