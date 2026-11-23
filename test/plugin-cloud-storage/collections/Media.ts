import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: ({ req }) =>
      !req.headers.has('x-disallow-create') &&
      (Boolean(req.user) || req.headers.has('x-public-create')),
    update: ({ req }) => Boolean(req.user) && !req.headers.has('x-disallow-update'),
  },
  upload: {
    disableLocalStorage: true,
    focalPoint: true,
    // Cropping an existing upload refetches the stored file through its served
    // URL, which resolves to `localhost` under prod-server e2e and gets rejected
    // by `safeFetch`'s SSRF guard.
    skipSafeFetch: true,
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
