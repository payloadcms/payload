import type { Block } from 'payload'

export const TextContainerBlock: Block = {
  slug: 'TextContainer',
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
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}
