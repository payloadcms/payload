import { IncomingCollectionVersions, IncomingGlobalVersions } from './types';

export const versionCollectionDefaults: IncomingCollectionVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
  maxPerDoc: 50,
  retainDeleted: true,
};

export const versionGlobalDefaults: IncomingGlobalVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
  max: 50,
};
