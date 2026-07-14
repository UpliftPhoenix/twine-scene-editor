import * as React from 'react';
import {Passage} from '../../../store/stories';
import {Point} from '../../../util/geometry';
import {tagLinkHandleOrigin} from '../../../util/tag-link';

export interface TagLinkDragPreviewProps {
	/**
	 * The data node whose link handle is being dragged.
	 */
	node: Passage;
	/**
	 * Current drag position in logical (unzoomed) map coordinates.
	 */
	point: Point;
}

/**
 * The line shown while the user drags a data node's link handle, from the
 * handle to the cursor.
 */
export const TagLinkDragPreview: React.FC<TagLinkDragPreviewProps> = props => {
	const {node, point} = props;
	const origin = tagLinkHandleOrigin(node);

	return (
		<path
			className="passage-connection variant-tag tag-link-drag-preview"
			d={`M ${origin.left} ${origin.top} L ${point.left} ${point.top}`}
			style={{markerEnd: 'url(#tag-arrowhead)'}}
		/>
	);
};
