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
