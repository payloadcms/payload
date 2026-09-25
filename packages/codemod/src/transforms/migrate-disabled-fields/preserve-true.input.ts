export const cfg = {
  slug: 'preserve',
  fields: [
    {
      name: 'a',
      type: 'text',
      admin: {
        disabled: true,
        disableListColumn: true,
        disableBulkEdit: true,
      },
    },
  ],
}
