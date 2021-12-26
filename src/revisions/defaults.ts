import { IncomingRevisionsType } from './types';

export const revisionDefaults: IncomingRevisionsType = {
  drafts: {
    autosave: {
      time: 5, // in seconds
    },
  },
  maxPerDoc: 50,
  retainDeleted: true,
};
