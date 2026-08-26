import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    disableLocalStorage: true,
    focalPoint: true,
    // Cropping an existing upload refetches the stored file through its served
    // URL, which resolves to `localhost` under prod-server e2e and gets rejected
    // by `safeFetch`'s SSRF guard.
    skipSafeFetch: true,
    resizeOptions: {
      position: 'center',
      width: 200,
      height: 200,
    },
    imageSizes: [
      {
        height: 400,
        width: 400,
        crop: 'center',
        name: 'square',
      },
      {
        width: 900,
        height: 450,
        crop: 'center',
        name: 'sixteenByNineMedium',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
  versions: false,
}
