import type { CollectionConfig } from '../../../../src/collections/config/types';

export const mediaSlug = 'media';

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  upload: true,
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [],
};
