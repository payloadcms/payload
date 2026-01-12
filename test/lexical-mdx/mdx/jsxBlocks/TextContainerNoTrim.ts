import type { Block } from 'payload'

export const TextContainerNoTrimBlock: Block = {
  slug: 'TextContainerNoTrim',
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
