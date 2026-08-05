import classnames from 'classnames';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {Passage} from '../../../store/stories';
import {dataNodeTemplate} from '../../../util/data-node-templates';
import {Point} from '../../../util/geometry';
import {nodeNegationTag} from '../../../util/tag-link';
import {connectionArc} from './connection-arc';
import './tag-link-negation.css';

// Size of the widget in logical map coordinates. It scales with the map's
// zoom, like the cards do.

const widgetWidth = 52;
const widgetHeight = 28;

export interface TagLinkNegationProps {
	/**
	 * The data node the link starts at.
	 */
	node: Passage;
	offset: Point;
	onToggleNegation: (node: Passage, passage: Passage) => void;
	/**
	 * The passage the link ends at, which carries the negation tag when the link
	 * is negated.
	 */
	passage: Passage;
}

/**
 * A toggle pinned to the center of a tag-link connection, reading `YES` or
 * `NO`: negating the link makes the passage the branch taken when the node's
 * condition isn't met. See util/tag-link.ts for how negation is stored.
 */
export const TagLinkNegation: React.FC<TagLinkNegationProps> = props => {
	const {node, offset, onToggleNegation, passage} = props;
	const {t} = useTranslation();
	const {left: offsetLeft, top: offsetTop} = offset;
	const midpoint = React.useMemo(
		() =>
			connectionArc(node, passage, {left: offsetLeft, top: offsetTop})
				?.midpoint,
		[node, offsetLeft, offsetTop, passage]
	);
	const tag = nodeNegationTag(node);

	if (!midpoint || !tag) {
		return null;
	}

	const color = dataNodeTemplate(node.dataTemplate)?.color;
	const negated = passage.tags.includes(tag);
	const label = t(
		negated
			? 'components.tagLinkNegation.turnOff'
			: 'components.tagLinkNegation.turnOn',
		{name: node.name}
	);

	return (
		<foreignObject
			height={widgetHeight}
			width={widgetWidth}
			x={midpoint.left - widgetWidth / 2}
			y={midpoint.top - widgetHeight / 2}
		>
			<button
				aria-label={label}
				aria-pressed={negated}
				className={classnames('tag-link-negation', {negated})}
				onClick={() => onToggleNegation(node, passage)}
				style={negated ? undefined : {background: color, borderColor: color}}
				title={label}
			>
				{t(
					negated
						? 'components.tagLinkNegation.no'
						: 'components.tagLinkNegation.yes'
				)}
			</button>
		</foreignObject>
	);
};

export interface TagLinkNegationWidgetsProps {
	connections: Map<Passage, Set<Passage>>;
	offset: Point;
	onToggleNegation: (node: Passage, passage: Passage) => void;
}

/**
 * Negation toggles for every tag-link connection whose data node's template
 * allows negating its links. `connections` matches the shape of
 * tagLinkConnections() results: keys are data nodes, values the passages
 * they're linked to.
 */
export const TagLinkNegationWidgets: React.FC<
	TagLinkNegationWidgetsProps
> = props => {
	const {connections, offset, onToggleNegation} = props;

	return (
		<>
			{Array.from(connections).map(([node, passages]) => {
				if (!dataNodeTemplate(node.dataTemplate)?.linkNegation) {
					return null;
				}

				return Array.from(passages).map(passage => (
					<TagLinkNegation
						key={node.name + passage.name}
						node={node}
						offset={offset}
						onToggleNegation={onToggleNegation}
						passage={passage}
					/>
				));
			})}
		</>
	);
};
