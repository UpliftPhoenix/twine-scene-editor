import {Passage, Story} from '../store/stories';
import {AppInfo} from './app-info';

// This module converts a story to JSON matching the output of the Twine to
// JSON project (https://jtschoonhoven.github.io/twine-to-json/), so that files
// exported here are interchangeable with ones produced by that tool. The
// link/hook extraction logic below is ported from its source.

const FORMAT_TWINE = 'twine';
const FORMAT_HARLOWE_3 = 'harlowe-3';

export interface JsonLink {
	linkText: string;
	passageName: string;
	original: string;
}

export interface JsonHook {
	hookName?: string;
	hookText: string;
	original: string;
}

export interface JsonPassage {
	name: string;
	tags: string;
	id: string;
	text: string;
	links: JsonLink[];
	hooks?: JsonHook[];
	cleanText: string;
}

export interface JsonDataNode {
	name: string;
	tags: string;
	id: string;
	/**
	 * The node's parsed JSON contents. If the node's text isn't valid JSON,
	 * this is the raw text instead.
	 */
	data: unknown;
}

export interface JsonStory {
	uuid: string;
	name: string;
	creator: string;
	creatorVersion: string;
	schemaName: string;
	schemaVersion: string;
	createdAtMs: number;
	passages: JsonPassage[];
	data: JsonDataNode[];
}

/**
 * Returns the twine-to-json format identifier to use for a story. Hook
 * extraction only applies to Harlowe 3.
 */
function jsonFormat(story: Story) {
	if (
		story.storyFormat.trim().toLowerCase() === 'harlowe' &&
		story.storyFormatVersion.split('.')[0] === '3'
	) {
		return FORMAT_HARLOWE_3;
	}

	return FORMAT_TWINE;
}

/**
 * Returns the text between a matched pair of brackets, starting at an open
 * bracket. Nested brackets are kept intact.
 */
function getSubstringBetweenBrackets(
	value: string,
	startIndex: number,
	openBracket = '[',
	closeBracket = ']'
) {
	const bracketStack: string[] = [];
	let currentIndex = startIndex;
	let substring = '';

	if (value[currentIndex] !== openBracket) {
		throw new Error(
			'startIndex of getSubstringBetweenBrackets must correspond to an open bracket'
		);
	}

	while (currentIndex < value.length) {
		const currentChar = value[currentIndex];

		if (currentChar === closeBracket) {
			bracketStack.pop();
		}

		if (bracketStack.length) {
			substring += currentChar;
		}

		if (currentChar === openBracket) {
			bracketStack.push(currentChar);
		}

		if (!bracketStack.length) {
			return substring;
		}

		currentIndex += 1;
	}

	return substring;
}

/**
 * Extracts a `[[link]]` starting at an index of passage text, if one is
 * present there. Handles the plain, `->`, and `<-` link forms.
 */
function extractLinkAtIndex(
	passageText: string,
	currentIndex: number
): JsonLink | undefined {
	if (
		passageText[currentIndex] !== '[' ||
		passageText[currentIndex + 1] !== '['
	) {
		return undefined;
	}

	const link = getSubstringBetweenBrackets(passageText, currentIndex + 1);
	const leftSplit = link.split('<-', 2);
	const rightSplit = link.split('->', 2);
	const original = passageText.substring(
		currentIndex,
		currentIndex + link.length + 4
	);

	if (leftSplit.length === 2) {
		return {
			linkText: leftSplit[1].trim(),
			passageName: leftSplit[0].trim(),
			original
		};
	}

	if (rightSplit.length === 2) {
		return {
			linkText: rightSplit[0].trim(),
			passageName: rightSplit[1].trim(),
			original
		};
	}

	return {linkText: link.trim(), passageName: link.trim(), original};
}

/**
 * Extracts a Harlowe named hook of the form `|name>[text]` starting at an
 * index of passage text, if one is present there.
 */
function extractLeftHookAtIndex(
	passageText: string,
	currentIndex: number
): JsonHook | undefined {
	if (passageText[currentIndex] !== '|') {
		return undefined;
	}

	const hookName = getSubstringBetweenBrackets(
		passageText,
		currentIndex,
		'|',
		'>'
	);

	if (!/[a-z0-9]+/i.test(hookName)) {
		return undefined;
	}

	const hookStartIndex = currentIndex + hookName.length + 2;

	if (passageText[hookStartIndex] !== '[') {
		return undefined;
	}

	const hookText = getSubstringBetweenBrackets(passageText, hookStartIndex);
	const hookEndIndex = hookStartIndex + hookText.length + 2;

	return {
		hookName,
		hookText,
		original: passageText.substring(currentIndex, hookEndIndex)
	};
}

/**
 * Extracts a Harlowe hook of the form `[text]<name|` or an anonymous
 * `[text]` hook starting at an index of passage text, if one is present
 * there.
 */
function extractHookAtIndex(
	passageText: string,
	currentIndex: number
): JsonHook | undefined {
	const prevChar = currentIndex ? passageText[currentIndex - 1] : undefined;

	if (
		passageText[currentIndex] !== '[' ||
		passageText[currentIndex + 1] === '[' ||
		prevChar === '['
	) {
		return undefined;
	}

	const hookText = getSubstringBetweenBrackets(passageText, currentIndex);
	const hookEndIndex = currentIndex + hookText.length + 2;

	if (passageText[hookEndIndex] === '<') {
		const hookName = getSubstringBetweenBrackets(
			passageText,
			hookEndIndex,
			'<',
			'|'
		);

		if (/[a-z0-9]+/i.test(hookName)) {
			return {
				hookName,
				hookText,
				original: passageText.substring(
					currentIndex,
					hookEndIndex + hookName.length + 2
				)
			};
		}
	}

	return {
		hookName: undefined,
		hookText,
		original: passageText.substring(currentIndex, hookEndIndex)
	};
}

/**
 * Scans passage text for links and, in Harlowe 3, hooks.
 */
function processPassageText(passageText: string, format: string) {
	const links: JsonLink[] = [];
	const hooks: JsonHook[] = [];
	let currentIndex = 0;

	while (currentIndex < passageText.length) {
		const maybeLink = extractLinkAtIndex(passageText, currentIndex);

		if (maybeLink) {
			links.push(maybeLink);
			currentIndex += maybeLink.original.length;
		}

		if (format !== FORMAT_HARLOWE_3) {
			currentIndex += 1;
			continue;
		}

		const maybeLeftHook = extractLeftHookAtIndex(passageText, currentIndex);

		if (maybeLeftHook) {
			hooks.push(maybeLeftHook);
			currentIndex += maybeLeftHook.original.length;
		}

		currentIndex += 1;

		const maybeHook = extractHookAtIndex(passageText, currentIndex);

		if (maybeHook) {
			hooks.push(maybeHook);
			currentIndex += maybeHook.original.length;
		}
	}

	return {links, hooks};
}

/**
 * Returns passage text with all extracted links and hooks removed.
 */
function cleanText(
	passageText: string,
	links: JsonLink[],
	hooks: JsonHook[],
	format: string
) {
	for (const link of links) {
		passageText = passageText.replace(link.original, '');
	}

	if (format === FORMAT_HARLOWE_3) {
		for (const hook of hooks) {
			passageText = passageText.replace(hook.original, '');
		}
	}

	return passageText.trim();
}

/**
 * Converts a single passage to its JSON representation. As with published
 * stories, passages are identified by a sequential numeric ID, not their UUID.
 */
function passageToJson(
	passage: Passage,
	localId: number,
	format: string
): JsonPassage {
	const text = passage.text.trim();
	const {links, hooks} = processPassageText(text, format);

	return {
		name: passage.name,
		tags: passage.tags.join(' '),
		id: localId.toString(),
		text,
		links,
		...(format === FORMAT_HARLOWE_3 ? {hooks} : {}),
		cleanText: cleanText(text, links, hooks, format)
	};
}

/**
 * Converts a single data node to its JSON representation. Like passages, data
 * nodes are identified by a sequential numeric ID, not their UUID.
 */
function dataNodeToJson(passage: Passage, localId: number): JsonDataNode {
	let data: unknown = passage.text;

	try {
		data = JSON.parse(passage.text);
	} catch (error) {
		// The node's text isn't valid JSON, so export it as raw text.
	}

	return {
		name: passage.name,
		tags: passage.tags.join(' '),
		id: localId.toString(),
		data
	};
}

/**
 * Converts a story to a JSON-serializable structure matching the Twine to
 * JSON format, extended with a `data` array containing the story's data
 * nodes.
 */
export function storyToJsonData(story: Story, appInfo: AppInfo): JsonStory {
	const format = jsonFormat(story);
	const passages = story.passages.filter(passage => passage.type !== 'data');
	const dataNodes = story.passages.filter(passage => passage.type === 'data');

	return {
		uuid: story.ifid,
		name: story.name,
		creator: appInfo.name,
		creatorVersion: appInfo.version,
		schemaName: story.storyFormat,
		schemaVersion: story.storyFormatVersion,
		createdAtMs: Date.now(),
		passages: passages.map((passage, index) =>
			passageToJson(passage, index + 1, format)
		),
		data: dataNodes.map((dataNode, index) => dataNodeToJson(dataNode, index + 1))
	};
}

/**
 * Converts a story to formatted JSON text.
 */
export function storyToJson(story: Story, appInfo: AppInfo) {
	return JSON.stringify(storyToJsonData(story, appInfo), null, 2);
}
