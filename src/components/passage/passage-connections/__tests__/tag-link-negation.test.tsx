import {fireEvent, render, screen} from '@testing-library/react';
import * as React from 'react';
import {Passage} from '../../../../store/stories';
import {fakePassage} from '../../../../test-util';
import {
	TagLinkNegation,
	TagLinkNegationProps,
	TagLinkNegationWidgets,
	TagLinkNegationWidgetsProps
} from '../tag-link-negation';

function fakeNode(props?: Partial<Passage>) {
	return fakePassage({
		dataTemplate: 'trigger',
		height: 100,
		left: 0,
		name: 'My Trigger',
		top: 0,
		type: 'data',
		width: 100,
		...props
	});
}

function fakeTarget(props?: Partial<Passage>) {
	return fakePassage({
		height: 100,
		left: 500,
		name: 'Target',
		top: 500,
		width: 100,
		...props
	});
}

describe('<TagLinkNegation>', () => {
	function renderComponent(props?: Partial<TagLinkNegationProps>) {
		const onToggleNegation = jest.fn();
		const result = render(
			<svg>
				<TagLinkNegation
					node={fakeNode()}
					offset={{left: 0, top: 0}}
					onToggleNegation={onToggleNegation}
					passage={fakeTarget()}
					{...props}
				/>
			</svg>
		);

		return {...result, onToggleNegation};
	}

	it("isn't pressed, and reads YES, when the passage has no negation tag", () => {
		renderComponent();

		const button = screen.getByRole('button');

		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(button).toHaveTextContent('components.tagLinkNegation.yes');
	});

	it('is pressed, and reads NO, when the passage carries the negation tag', () => {
		renderComponent({
			passage: fakeTarget({tags: ['trigger:My-Trigger', 'not:My-Trigger']})
		});

		const button = screen.getByRole('button');

		expect(button).toHaveAttribute('aria-pressed', 'true');
		expect(button).toHaveTextContent('components.tagLinkNegation.no');
	});

	it('calls onToggleNegation with the node and passage when clicked', () => {
		const node = fakeNode();
		const passage = fakeTarget({tags: ['trigger:My-Trigger']});
		const {onToggleNegation} = renderComponent({node, passage});

		fireEvent.click(screen.getByRole('button'));
		expect(onToggleNegation).toHaveBeenCalledTimes(1);
		expect(onToggleNegation).toHaveBeenCalledWith(node, passage);
	});

	it("renders nothing if the node's links can't be negated", () => {
		renderComponent({node: fakeNode({dataTemplate: 'npc', name: 'NPC'})});
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});

describe('<TagLinkNegationWidgets>', () => {
	function renderComponent(props?: Partial<TagLinkNegationWidgetsProps>) {
		const node = fakeNode();

		return render(
			<svg>
				<TagLinkNegationWidgets
					connections={new Map([[node, new Set([fakeTarget()])]])}
					offset={{left: 0, top: 0}}
					onToggleNegation={jest.fn()}
					{...props}
				/>
			</svg>
		);
	}

	it('renders a toggle for every connection of a negatable node', () => {
		renderComponent({
			connections: new Map([
				[
					fakeNode(),
					new Set([
						fakeTarget(),
						fakeTarget({left: 800, name: 'Other', top: 800})
					])
				]
			])
		});
		expect(screen.getAllByRole('button').length).toBe(2);
	});

	it("renders nothing for nodes whose template doesn't allow negation", () => {
		renderComponent({
			connections: new Map([
				[
					fakeNode({dataTemplate: 'npc', name: 'NPC'}),
					new Set([fakeTarget()])
				]
			])
		});
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});
