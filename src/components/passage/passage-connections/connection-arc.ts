import {Passage} from '../../../store/stories';
import {arc} from '../../../util/svg';
import {
	lineAngle,
	lineDistance,
	Point,
	rectCenter,
	rectIntersectionWithLine
} from '../../../util/geometry';

// The Y radius of connection arcs, as a fraction of the distance they travel.
// The lower the ratio, the less curved the lines become--an aesthetic choice.

const flatness = 0.75;

// How far the center of an arc sits from the straight line between its
// endpoints, as a fraction of the distance between them. This falls out of
// the arc's geometry: its X radius is the full distance and its Y radius is
// `flatness` times that, which puts the arc's midpoint at
// flatness * (1 - sqrt(3) / 2) of the distance away from the chord.

const midpointOffset = flatness * (1 - Math.sqrt(3) / 2);

export interface ConnectionArc {
	/**
	 * The point halfway along the drawn arc, in logical map coordinates.
	 */
	midpoint: Point;
	/**
	 * SVG path string for the arc.
	 */
	path: string;
}

/**
 * Computes the arc drawn between two passages, from edge to edge, offsetting
 * either endpoint by `offset` if it's selected (and might be mid-drag).
 * Returns undefined if the passages overlap so that no arc can be drawn.
 */
export function connectionArc(
	start: Passage,
	end: Passage,
	offset: Point
): ConnectionArc | undefined {
	// If either passage is selected, offset it. We need to take care not to
	// overwrite the passage information.

	let offsetStart = start;
	let offsetEnd = end;

	if (start.selected) {
		offsetStart = {
			...start,
			left: start.left + offset.left,
			top: start.top + offset.top
		};
	}

	if (end.selected) {
		offsetEnd = {
			...end,
			left: end.left + offset.left,
			top: end.top + offset.top
		};
	}

	// Start at the center of both passages.

	let startPoint: Point | null = rectCenter(offsetStart);
	let endPoint: Point | null = rectCenter(offsetEnd);

	// Move both points to where they intersect with the edges of their passages.

	startPoint = rectIntersectionWithLine(offsetStart, startPoint, endPoint);

	if (!startPoint) {
		return undefined;
	}

	endPoint = rectIntersectionWithLine(offsetEnd, startPoint, endPoint);

	if (!endPoint) {
		return undefined;
	}

	// Draw a flattened arc, to make it easier to distinguish between links
	// between passages with the same horizontal or vertical position (which
	// would otherwise be overlapping flat lines).
	//
	// The horizontal radius of our arc is proportional to the distance
	// the line will travel.

	const distance = lineDistance(startPoint, endPoint);

	// Rotate the arc so that its underside will always face downward. We cheat
	// vertical lines so that their undersides face right--an aesthetic choice,
	// and so that bidirectional links line up.

	let sweep = startPoint.left < endPoint.left;

	if (startPoint.left === endPoint.left && startPoint.top < endPoint.top) {
		sweep = true;
	}

	const angle = lineAngle(startPoint, endPoint);

	// The midpoint of the arc: halfway along the chord, pushed away from it
	// perpendicularly on the side the arc bulges toward. Work in the chord's
	// frame (where it runs from the origin along the X axis), then rotate back.

	const radians = (angle * Math.PI) / 180;
	const chordMid = distance / 2;
	const bulge = (sweep ? -1 : 1) * midpointOffset * distance;
	const midpoint: Point = {
		left:
			startPoint.left + chordMid * Math.cos(radians) - bulge * Math.sin(radians),
		top: startPoint.top + chordMid * Math.sin(radians) + bulge * Math.cos(radians)
	};

	return {
		midpoint,
		path: arc({
			start: startPoint,
			end: endPoint,
			radius: {left: distance, top: distance * flatness},
			rotation: angle,
			sweep
		})
	};
}
