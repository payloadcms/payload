export const Media = {
  slug: 'media',
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        admin: {
          disabled: { column: true, filter: true, groupBy: true },
        },
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        admin: {
          disabled: { column: true },
        },
      },
      {
        name: 'card',
        width: 600,
        height: 400,
      },
    ],
  },
}
