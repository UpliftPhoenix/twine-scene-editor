import * as React from 'react';
import {
	Passage,
	passageConnections,
	tagLinkConnections
} from '../../../store/stories';
import {Point} from '../../../util/geometry';
import {PassageConnectionGroup} from './passage-connection-group';
import {LinkMarkers} from './link-markers';
import {StartConnection} from './start-connection';
import {TagLinkDragPreview} from './tag-link-drag-preview';
import {TagLinkPriorityWidgets} from './tag-link-priority';
import {useFormatReferenceParser} from '../../../store/use-format-reference-parser';

export interface PassageConnectionsProps {
	formatName: string;
	formatVersion: string;
	offset: Point;
	/**
	 * Called when the user changes a linked passage's priority from the widget
	 * on a tag-link connection. If omitted, no widgets are shown.
	 */
	onChangeTagLinkPriority?: (passage: Passage, delta: number) => void;
	passages: Passage[];
	startPassageId: string;
	/**
	 * If set, a data node's link handle is being dragged and a preview line is
	 * drawn from the node to this point (in logical map coordinates).
	 */
	tagLinkDrag?: {node: Passage; point: Point};
}

const emptySet = new Set<Passage>();
const noOffset: Point = {left: 0, top: 0};

export const PassageConnections: React.FC<PassageConnectionsProps> = props => {
	const {
		formatName,
		formatVersion,
		offset,
		onChangeTagLinkPriority,
		passages,
		startPassageId,
		tagLinkDrag
	} = props;
	const referenceParser = useFormatReferenceParser(formatName, formatVersion);
	const {draggable: draggableLinks, fixed: fixedLinks} = React.useMemo(
		() => passageConnections(passages),
		[passages]
	);
	const {
		draggable: draggableTagLinks,
		fixed: fixedTagLinks
	} = React.useMemo(() => tagLinkConnections(passages), [passages]);
	const {
		draggable: draggableReferences,
		fixed: fixedReferences
	} = React.useMemo(() => passageConnections(passages, referenceParser), [
		passages,
		referenceParser
	]);

	const startPassage = React.useMemo(
		() => passages.find(passage => passage.id === startPassageId),
		[passages, startPassageId]
	);

	// References only show existing connections.

	return (
		<svg className="link-connectors">
			<LinkMarkers />
			{startPassage && (
				<StartConnection offset={offset} passage={startPassage} />
			)}
			<PassageConnectionGroup {...draggableLinks} offset={offset} />
			<PassageConnectionGroup {...fixedLinks} offset={noOffset} />
			<PassageConnectionGroup
				broken={emptySet}
				connections={draggableReferences.connections}
				offset={offset}
				self={emptySet}
				variant="reference"
			/>
			<PassageConnectionGroup
				broken={emptySet}
				connections={fixedReferences.connections}
				offset={noOffset}
				self={emptySet}
				variant="reference"
			/>
			<PassageConnectionGroup
				broken={emptySet}
				connections={draggableTagLinks}
				offset={offset}
				self={emptySet}
				variant="tag"
			/>
			<PassageConnectionGroup
				broken={emptySet}
				connections={fixedTagLinks}
				offset={noOffset}
				self={emptySet}
				variant="tag"
			/>
			<PassageConnectionGroup
				broken={emptySet}
				connections={draggableLinks.nodeConnections}
				offset={offset}
				self={emptySet}
				variant="tag"
			/>
			<PassageConnectionGroup
				broken={emptySet}
				connections={fixedLinks.nodeConnections}
				offset={noOffset}
				self={emptySet}
				variant="tag"
			/>
			{onChangeTagLinkPriority && (
				<>
					<TagLinkPriorityWidgets
						connections={draggableTagLinks}
						offset={offset}
						onChangePriority={onChangeTagLinkPriority}
					/>
					<TagLinkPriorityWidgets
						connections={fixedTagLinks}
						offset={noOffset}
						onChangePriority={onChangeTagLinkPriority}
					/>
				</>
			)}
			{tagLinkDrag && (
				<TagLinkDragPreview node={tagLinkDrag.node} point={tagLinkDrag.point} />
			)}
		</svg>
	);
};
