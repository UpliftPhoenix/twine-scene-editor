import * as React from 'react';
import {TagColors} from '../../store/stories';
import {tagLinkColor} from '../../util/tag-link';
import './tag-badges.css';

export interface TagBadgesProps {
	tagColors: TagColors;
	tags: string[];
}

export const TagBadges: React.FC<TagBadgesProps> = React.memo(props => {
	return (
		<div className="tag-badges">
			{props.tags.map(tag => {
				const linkColor = tagLinkColor(tag);

				return (
					<span
						className={linkColor ? undefined : `color-${props.tagColors[tag]}`}
						key={tag}
						style={
							linkColor
								? {borderColor: linkColor, background: `${linkColor}40`}
								: undefined
						}
					>
						{tag}
					</span>
				);
			})}
		</div>
	);
});

TagBadges.displayName = 'TagBadges';
