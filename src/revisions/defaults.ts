import { IncomingCollectionRevisionsType, IncomingGlobalRevisionsType } from './types';

export const revisionCollectionDefaults: IncomingCollectionRevisionsType = {
  drafts: {
    autosave: {
      interval: 5, // in seconds
    },
  },
  maxPerDoc: 50,
  retainDeleted: true,
};

export const revisionGlobalDefaults: IncomingGlobalRevisionsType = {
  drafts: {
    autosave: {
      interval: 5, // in seconds
    },
  },
  max: 50,
};
