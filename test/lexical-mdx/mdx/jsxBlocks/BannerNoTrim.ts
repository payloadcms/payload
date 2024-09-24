import type { Block } from 'payload'

export const BannerNoTrimBlock: Block = {
  slug: 'BannerNoTrim',
  jsx: {
    import: ({ children }) => {
      return {
        text: children,
      }
    },
    export: ({ fields }) => {
      return {
        props: {},
        children: fields.text,
      }
    },
    doNotTrimChildren: true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}
