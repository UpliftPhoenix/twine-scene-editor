import * as React from 'react';
import {TagColors} from '../../store/stories';
import {tagLinkColor} from '../../util/tag-link';
import './tag-stripe.css';

export interface TagStripeProps {
	tagColors: TagColors;
	tags: string[];
}

export const TagStripe: React.FC<TagStripeProps> = React.memo(props => {
	return (
		<div className="tag-stripe">
			{props.tags
				.map(tag => ({tag, linkColor: tagLinkColor(tag)}))
				.filter(({tag, linkColor}) => linkColor || tag in props.tagColors)
				.map(({tag, linkColor}) => (
					<span
						className={linkColor ? undefined : `color-${props.tagColors[tag]}`}
						key={tag}
						style={linkColor ? {background: linkColor} : undefined}
						title={tag}
					/>
				))}
		</div>
	);
});

TagStripe.displayName = 'TagStripe';
