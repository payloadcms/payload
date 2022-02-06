import { IncomingCollectionVersions, IncomingGlobalVersions } from './types';

export const versionCollectionDefaults: IncomingCollectionVersions = {
  drafts: {
    autosave: {
      interval: 5, // in seconds
    },
  },
  maxPerDoc: 50,
  retainDeleted: true,
};

export const versionGlobalDefaults: IncomingGlobalVersions = {
  drafts: {
    autosave: {
      interval: 5, // in seconds
    },
  },
  max: 50,
};
