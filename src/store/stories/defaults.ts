import {i18n} from '../../util/i18n';
import {Passage, Story} from './stories.types';

export const passageDefaults = (): Omit<Passage, 'id' | 'story'> => ({
	height: 100,
	highlighted: false,
	left: 0,
	name: i18n.t('store.passageDefaults.name'),
	selected: false,
	tags: [],
	text: '',
	top: 0,
	width: 100
});

export const dataNodeDefaults = (): Omit<Passage, 'id' | 'story'> => ({
	...passageDefaults(),
	name: i18n.t('store.dataNodeDefaults.name'),
	text: '{}',
	type: 'data'
});

export const npcNodeDefaults = (): Omit<Passage, 'id' | 'story'> => ({
	...dataNodeDefaults(),
	dataTemplate: 'npc',
	name: i18n.t('store.npcNodeDefaults.name')
});

export const storyDefaults = (): Omit<Story, 'id'> => ({
	ifid: '',
	lastUpdate: new Date(),
	passages: [],
	name: i18n.t('store.storyDefaults.name'),
	script: '',
	selected: false,
	snapToGrid: true,
	startPassage: '',
	storyFormat: '',
	storyFormatVersion: '',
	stylesheet: '',
	tags: [],
	tagColors: {},
	zoom: 1
});
