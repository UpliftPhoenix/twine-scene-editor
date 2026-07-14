// Tag links connect data nodes to passages through tags. A data node whose
// template has `tagLink` set owns a tag name, `templateId:nodeName`, and it is
// considered linked to every passage carrying that tag. The tag is the only
// record of the link--there's no separate connection state--so adding or
// removing the tag by hand makes or breaks the link just as well as dragging
// the node's link handle does.

import {Passage} from '../store/stories/stories.types';
import {dataNodeTemplate} from './data-node-templates';
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
 * Where a node's link handle sits, in logical map coordinates: centered on the
 * node's right edge. Drags of the handle start here, and the drag preview line
 * is anchored here.
 */
export function tagLinkHandleOrigin(node: Rect): Point {
	return {left: node.left + node.width, top: node.top + node.height / 2};
}
