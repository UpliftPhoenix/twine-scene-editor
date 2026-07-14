import * as React from 'react';
import {DraggableCore, DraggableEventHandler} from 'react-draggable';
import {useTranslation} from 'react-i18next';
import {Passage} from '../../store/stories';
import {Point} from '../../util/geometry';
import './tag-link-handle.css';

export interface TagLinkHandleProps {
	/**
	 * Called repeatedly during a drag with the change in position since the
	 * last call, in screen pixels.
	 */
	onDrag: (passage: Passage, delta: Point) => void;
	onDragStart: (passage: Passage) => void;
	onDragStop: (passage: Passage) => void;
	passage: Passage;
}

/**
 * The linkage that sticks out of a tag-linkable data node. Dragging it and
 * dropping it onto a passage links the node to that passage. It stays put
 * while dragged--the drag is shown as a preview line in the connection
 * layer--so there's always a fresh handle to drag for the next link.
 */
export const TagLinkHandle: React.FC<TagLinkHandleProps> = props => {
	const {onDrag, onDragStart, onDragStop, passage} = props;
	const container = React.useRef<HTMLDivElement>(null);
	const {t} = useTranslation();

	const handleMouseDown = React.useCallback((event: MouseEvent) => {
		// Don't let the card underneath see this event--it would start a card
		// drag or change the selection.

		event.stopPropagation();
	}, []);
	const handleStart: DraggableEventHandler = React.useCallback(
		event => {
			event.stopPropagation();
			onDragStart(passage);
		},
		[onDragStart, passage]
	);
	const handleDrag: DraggableEventHandler = React.useCallback(
		(event, data) => onDrag(passage, {left: data.deltaX, top: data.deltaY}),
		[onDrag, passage]
	);
	const handleStop: DraggableEventHandler = React.useCallback(
		() => onDragStop(passage),
		[onDragStop, passage]
	);

	return (
		<DraggableCore
			nodeRef={container}
			onMouseDown={handleMouseDown}
			onStart={handleStart}
			onDrag={handleDrag}
			onStop={handleStop}
		>
			<div
				aria-label={t('components.tagLinkHandle.label')}
				className="tag-link-handle"
				ref={container}
				role="button"
				title={t('components.tagLinkHandle.label')}
			/>
		</DraggableCore>
	);
};
