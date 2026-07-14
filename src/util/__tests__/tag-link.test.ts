import {fakePassage} from '../../test-util';
import {tagLinkHandleOrigin, tagLinkName, tagLinkNodeName} from '../tag-link';

describe('tagLinkNodeName', () => {
	it('leaves names without whitespace alone', () =>
		expect(tagLinkNodeName('MyTrigger')).toBe('MyTrigger'));

	it('replaces runs of whitespace with dashes', () =>
		expect(tagLinkNodeName('Untitled  Data\tNode')).toBe('Untitled-Data-Node'));

	it('trims leading and trailing whitespace', () =>
		expect(tagLinkNodeName('  spaced out  ')).toBe('spaced-out'));
});

describe('tagLinkName', () => {
	it('returns templateId:nodeName for data nodes with a tag-linkable template', () => {
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'trigger', name: 'My Trigger', type: 'data'})
			)
		).toBe('trigger:My-Trigger');
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'requirement', name: 'Req', type: 'data'})
			)
		).toBe('requirement:Req');
		expect(
			tagLinkName(
				fakePassage({dataTemplate: 'npc', name: 'Shop Keeper', type: 'data'})
			)
		).toBe('npc:Shop-Keeper');
	});

	it('returns undefined for regular passages', () => {
		expect(tagLinkName(fakePassage())).toBeUndefined();
		expect(
			tagLinkName(fakePassage({dataTemplate: 'trigger'}))
		).toBeUndefined();
	});

	it('returns undefined for data nodes without a template', () =>
		expect(tagLinkName(fakePassage({type: 'data'}))).toBeUndefined());

	it("returns undefined for data nodes whose template isn't tag-linkable", () =>
		expect(
			tagLinkName(fakePassage({dataTemplate: 'item-reward', type: 'data'}))
		).toBeUndefined());

	it('returns undefined for data nodes with an unknown template', () =>
		expect(
			tagLinkName(fakePassage({dataTemplate: 'nonexistent', type: 'data'}))
		).toBeUndefined());
});

describe('tagLinkHandleOrigin', () => {
	it("returns the center of the node's right edge", () =>
		expect(
			tagLinkHandleOrigin({left: 10, top: 20, width: 100, height: 50})
		).toEqual({left: 110, top: 45}));
});
