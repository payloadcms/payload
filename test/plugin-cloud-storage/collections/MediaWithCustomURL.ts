import type { CollectionConfig } from 'payload'

export const MediaWithCustomURL: CollectionConfig = {
  slug: 'media-with-custom-url',
  fields: [],
  upload: {
    adminThumbnail: 'thumbnail',
    disableLocalStorage: true,
    imageSizes: [
      {
        name: 'thumbnail',
        height: 225,
        width: 300,
      },
    ],
  },
  versions: false,
}
