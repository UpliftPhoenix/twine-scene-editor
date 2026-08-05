// Tag links connect data nodes to passages through tags. A data node whose
// template has `tagLink` set owns a tag name, `templateId:nodeName`, and it is
// considered linked to every passage carrying that tag. The tag is the only
// record of the link--there's no separate connection state--so adding or
// removing the tag by hand makes or breaks the link just as well as dragging
// the node's link handle does.

import {Passage} from '../store/stories/stories.types';
import {dataNodeTemplate, DataNodeTemplate} from './data-node-templates';
import {Point, Rect} from './geometry';

/**
 * Converts a data node name to the form it takes inside a tag link. Tag names
 * can't contain whitespace, so runs of it become dashes.
 */
export function tagLinkNodeName(name: string) {
	return name.trim().replace(/\s+/g, '-');
}

/**
 * Returns the tag a passage carries when it's linked to this data node, or
 * undefined if the passage isn't a data node using a tag-linkable template.
 */
export function tagLinkName(passage: Passage): string | undefined {
	if (passage.type !== 'data') {
		return undefined;
	}

	const template = dataNodeTemplate(passage.dataTemplate);

	if (!template?.tagLink) {
		return undefined;
	}

	return `${template.id}:${tagLinkNodeName(passage.name)}`;
}

/**
 * Returns the template a tag link belongs to, or undefined if the tag isn't a
 * tag link at all.
 */
export function tagLinkTemplate(tag: string): DataNodeTemplate | undefined {
	const separator = tag.indexOf(':');

	if (separator === -1) {
		return undefined;
	}

	const template = dataNodeTemplate(tag.substring(0, separator));

	return template?.tagLink ? template : undefined;
}

/**
 * If a tag is a tag link for a template with a theme color, returns that
 * color. Tag links render in their template's color wherever they appear, so
 * the link and the node it comes from read as one thing.
 */
export function tagLinkColor(tag: string): string | undefined {
	return tagLinkTemplate(tag)?.color;
}

/**
 * Where a node's link handle sits, in logical map coordinates: centered on the
 * node's right edge. Drags of the handle start here, and the drag preview line
 * is anchored here.
 */
export function tagLinkHandleOrigin(node: Rect): Point {
	return {left: node.left + node.width, top: node.top + node.height / 2};
}

// Priority tags rank the passages linked to a data node whose template has
// `linkPriority` set. Like tag links themselves, the tag--`priority:N`--is the
// only record of the rank. A passage gets one when it's linked to such a node,
// keeps it while any priority-ranked link remains, and loses it when its last
// one goes away.

const priorityTagPrefix = 'priority:';

/**
 * Is a tag a priority tag?
 */
export function isPriorityTag(tag: string) {
	return tag.startsWith(priorityTagPrefix);
}

/**
 * The tag a passage carries when it has a link priority.
 */
export function priorityTag(priority: number) {
	return `${priorityTagPrefix}${priority}`;
}

/**
 * Returns a passage's link priority, or undefined if it has no valid priority
 * tag.
 */
export function passagePriority(passage: Passage): number | undefined {
	const tag = passage.tags.find(isPriorityTag);

	if (!tag) {
		return undefined;
	}

	const value = Number(tag.substring(priorityTagPrefix.length));

	return Number.isFinite(value) ? value : undefined;
}

/**
 * Returns a set of tags with the priority tag set to a value, replacing any
 * existing priority tags.
 */
export function tagsWithPriority(tags: string[], priority: number): string[] {
	return [...tags.filter(tag => !isPriorityTag(tag)), priorityTag(priority)];
}

/**
 * Does a tag link a passage to a node whose template ranks its links by
 * priority?
 */
export function tagLinkHasPriority(tag: string) {
	return !!tagLinkTemplate(tag)?.linkPriority;
}

/**
 * Removes priority tags from a set of tags if no priority-ranked tag link
 * remains to justify them, e.g. after the node they came from is deleted.
 */
export function tagsWithoutOrphanedPriority(tags: string[]): string[] {
	if (tags.some(tagLinkHasPriority)) {
		return tags;
	}

	return tags.filter(tag => !isPriorityTag(tag));
}

// Negation tags invert a single link from a data node whose template has
// `linkNegation` set: the passage is where the story goes when the node's
// condition *isn't* met. Like priority tags, the tag--`not:nodeName`--is the
// only record of the state, toggled from a widget on the connection line, and
// it's tied to the link that justifies it: break the link and the tag goes
// away.
//
// The tag names the node alone, not the whole tag link, so a requirement and a
// trigger with the same name share one negation tag--toggling either link
// toggles both.

const negationTagPrefix = 'not:';

/**
 * Is a tag a negation tag?
 */
export function isNegationTag(tag: string) {
	return tag.startsWith(negationTagPrefix);
}

/**
 * Does a tag link a passage to a node whose template allows negating its links?
 */
export function tagLinkHasNegation(tag: string) {
	return !!tagLinkTemplate(tag)?.linkNegation;
}

/**
 * The negation tag belonging to a tag link, or undefined if the tag isn't a
 * link that can be negated.
 */
export function tagLinkNegationTag(tag: string): string | undefined {
	if (!tagLinkHasNegation(tag)) {
		return undefined;
	}

	return `${negationTagPrefix}${tag.substring(tag.indexOf(':') + 1)}`;
}

/**
 * The negation tag for a data node's links, or undefined if the node's links
 * can't be negated.
 */
export function nodeNegationTag(node: Passage): string | undefined {
	const tag = tagLinkName(node);

	return tag ? tagLinkNegationTag(tag) : undefined;
}

/**
 * Returns a set of tags with a negation tag either present or absent.
 */
export function tagsWithNegation(
	tags: string[],
	negationTag: string,
	negated: boolean
): string[] {
	const others = tags.filter(tag => tag !== negationTag);

	return negated ? [...others, negationTag] : others;
}

/**
 * Removes negation tags that no remaining tag link justifies, e.g. after the
 * node they came from is deleted or unlinked.
 */
export function tagsWithoutOrphanedNegation(tags: string[]): string[] {
	const justified = new Set(
		tags
			.filter(tagLinkHasNegation)
			.map(tag => tagLinkNegationTag(tag) as string)
	);

	return tags.filter(tag => !isNegationTag(tag) || justified.has(tag));
}
