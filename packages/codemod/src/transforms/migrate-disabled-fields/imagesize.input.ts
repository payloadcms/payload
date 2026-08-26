export const Media = {
  slug: 'media',
  upload: {
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        admin: {
          disableListColumn: true,
          disableListFilter: true,
          disableGroupBy: true,
        },
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        admin: {
          disableListColumn: true,
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
