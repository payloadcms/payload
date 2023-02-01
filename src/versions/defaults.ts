import { IncomingCollectionVersions, IncomingGlobalVersions } from './types';

export const versionCollectionDefaults: IncomingCollectionVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
};

export const versionGlobalDefaults: IncomingGlobalVersions = {
  drafts: {
    autosave: {
      interval: 2000, // in milliseconds
    },
  },
};
