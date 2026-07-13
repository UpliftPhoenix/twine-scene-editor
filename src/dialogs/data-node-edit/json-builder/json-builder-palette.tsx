import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {addableJsonTypes} from './json-builder-utils';

/**
 * The drag data type used to identify JSON type chips dragged from the
 * palette onto the builder canvas.
 */
export const JSON_TYPE_DRAG_TYPE = 'application/x-twine-json-type';

/**
 * A palette of draggable JSON value types. Drag a chip onto an object or
 * array in the canvas to add a value of that type to it.
 */
export const JsonBuilderPalette: React.FC = () => {
	const {t} = useTranslation();

	return (
		<div className="json-builder-palette">
			{addableJsonTypes.map(type => (
				<div
					className={`json-builder-palette-item json-type-${type}`}
					draggable
					key={type}
					onDragStart={event => {
						event.dataTransfer.setData(JSON_TYPE_DRAG_TYPE, type);
						event.dataTransfer.effectAllowed = 'copy';
					}}
				>
					{t(`dialogs.dataNodeEdit.builder.types.${type}`)}
				</div>
			))}
			<span className="json-builder-palette-hint">
				{t('dialogs.dataNodeEdit.builder.paletteHint')}
			</span>
		</div>
	);
};
