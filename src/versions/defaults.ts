import { IncomingCollectionVersions, IncomingGlobalVersions } from './types';

export const versionCollectionDefaults: IncomingCollectionVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
  retainDeleted: true,
};

export const versionGlobalDefaults: IncomingGlobalVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
};
