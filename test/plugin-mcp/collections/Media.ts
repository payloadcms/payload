import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    pasteURL: {
      allowList: [{ hostname: '127.0.0.1', protocol: 'http' }],
    },
  },
  versions: false,
}

export const DispatchMedia: CollectionConfig = {
  slug: 'dispatch-media',
  fields: [],
  upload: {
    uploadInstructions: {
      generate: ({ filename, filesize, mimeType }) => ({
        name: 'uploadToTestProvider',
        type: 'dispatch',
        data: { token: 'test-token' },
        file: { filename, mimeType, size: filesize, uploadReference: {} },
      }),
      useInAdmin: true,
    },
  },
  versions: false,
}
