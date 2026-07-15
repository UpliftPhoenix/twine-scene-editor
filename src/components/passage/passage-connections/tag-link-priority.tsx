import {IconMinus, IconPlus} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {Passage} from '../../../store/stories';
import {dataNodeTemplate} from '../../../util/data-node-templates';
import {Point} from '../../../util/geometry';
import {passagePriority} from '../../../util/tag-link';
import {connectionArc} from './connection-arc';
import './tag-link-priority.css';

// Size of the widget in logical map coordinates. It scales with the map's
// zoom, like the cards do.

const widgetWidth = 72;
const widgetHeight = 28;

export interface TagLinkPriorityProps {
	/**
	 * The data node the link starts at.
	 */
	node: Passage;
	offset: Point;
	onChangePriority: (passage: Passage, delta: number) => void;
	/**
	 * The passage the link ends at, whose priority the widget shows.
	 */
	passage: Passage;
}

/**
 * A small control pinned to the center of a tag-link connection, showing the
 * linked passage's priority with buttons to raise or lower it. See
 * util/tag-link.ts for how priorities are stored.
 */
export const TagLinkPriority: React.FC<TagLinkPriorityProps> = props => {
	const {node, offset, onChangePriority, passage} = props;
	const {t} = useTranslation();
	const {left: offsetLeft, top: offsetTop} = offset;
	const midpoint = React.useMemo(
		() =>
			connectionArc(node, passage, {left: offsetLeft, top: offsetTop})
				?.midpoint,
		[node, offsetLeft, offsetTop, passage]
	);

	if (!midpoint) {
		return null;
	}

	const color = dataNodeTemplate(node.dataTemplate)?.color;
	const priority = passagePriority(passage) ?? 1;

	return (
		<foreignObject
			height={widgetHeight}
			width={widgetWidth}
			x={midpoint.left - widgetWidth / 2}
			y={midpoint.top - widgetHeight / 2}
		>
			<div className="tag-link-priority" style={{borderColor: color}}>
				<button
					aria-label={t('components.tagLinkPriority.decrease')}
					disabled={priority <= 1}
					onClick={() => onChangePriority(passage, -1)}
					title={t('components.tagLinkPriority.decrease')}
				>
					<IconMinus />
				</button>
				<span aria-label={t('components.tagLinkPriority.priority')}>
					{priority}
				</span>
				<button
					aria-label={t('components.tagLinkPriority.increase')}
					onClick={() => onChangePriority(passage, 1)}
					title={t('components.tagLinkPriority.increase')}
				>
					<IconPlus />
				</button>
			</div>
		</foreignObject>
	);
};

export interface TagLinkPriorityWidgetsProps {
	connections: Map<Passage, Set<Passage>>;
	offset: Point;
	onChangePriority: (passage: Passage, delta: number) => void;
}

/**
 * Priority widgets for every tag-link connection whose data node's template
 * ranks its links. `connections` matches the shape of tagLinkConnections()
 * results: keys are data nodes, values the passages they're linked to.
 */
export const TagLinkPriorityWidgets: React.FC<
	TagLinkPriorityWidgetsProps
> = props => {
	const {connections, offset, onChangePriority} = props;

	return (
		<>
			{Array.from(connections).map(([node, passages]) => {
				if (!dataNodeTemplate(node.dataTemplate)?.linkPriority) {
					return null;
				}

				return Array.from(passages).map(passage => (
					<TagLinkPriority
						key={node.name + passage.name}
						node={node}
						offset={offset}
						onChangePriority={onChangePriority}
						passage={passage}
					/>
				));
			})}
		</>
	);
};
