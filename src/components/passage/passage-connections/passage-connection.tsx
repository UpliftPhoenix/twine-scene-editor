import * as React from 'react';
import {isDataNode, Passage} from '../../../store/stories';
import {dataNodeTemplate} from '../../../util/data-node-templates';
import {Point} from '../../../util/geometry';
import {connectionArc} from './connection-arc';
import './passage-connection.css';

export type ConnectionVariant = 'link' | 'reference' | 'tag';

export interface PassageConnectionProps {
	end: Passage;
	offset: Point;
	start: Passage;
	variant: ConnectionVariant;
}

export const PassageConnection: React.FC<PassageConnectionProps> = props => {
	const {end, offset, start, variant} = props;
	const {left: offsetLeft, top: offsetTop} = offset;
	const path = React.useMemo(
		() =>
			connectionArc(start, end, {left: offsetLeft, top: offsetTop})?.path ?? '',
		[end, offsetLeft, offsetTop, start]
	);

	// Tag connections have a data node at one end--the start for tag links,
	// the end for a passage's [[link]] to a node--and take on its template's
	// theme color if it has one.

	const themeTemplate =
		variant === 'tag'
			? dataNodeTemplate((isDataNode(start) ? start : end).dataTemplate)
			: undefined;
	const themeColor = themeTemplate?.color;

	return (
		<path
			d={path}
			className={`passage-connection variant-${variant}`}
			style={{
				markerEnd: `url(#${
					variant === 'tag'
						? themeColor
							? `tag-arrowhead-${themeTemplate!.id}`
							: 'tag-arrowhead'
						: 'link-arrowhead'
				})`,
				stroke: themeColor
			}}
		/>
	);
};
