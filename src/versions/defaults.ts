import { IncomingCollectionVersions, IncomingGlobalVersions } from './types';

export const versionCollectionDefaults: IncomingCollectionVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
  retainDeleted: false,
};

export const versionGlobalDefaults: IncomingGlobalVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
};
