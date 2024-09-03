import type { Block } from 'payload'

export const PackageInstallOptions: Block = {
  slug: 'PackageInstallOptions',
  jsx: {
    import: ({ props, children, markdownToLexical }) => {
      return {
        global: props?.global,
        packageId: props?.packageId,
        someNestedObject: props?.someNestedObject,
        uniqueId: props?.uniqueId,
        update: props?.update,
      }
    },
    export: ({ fields, lexicalToMarkdown }) => {
      return {
        props: {
          global: fields?.global,
          packageId: fields?.packageId,
          someNestedObject: fields?.someNestedObject,
          uniqueId: fields?.uniqueId,
          update: fields?.update,
        },
      }
    },
  },
  fields: [
    {
      name: 'packageId',
      type: 'text',
    },
    {
      name: 'global',
      type: 'checkbox',
    },
    {
      name: 'update',
      type: 'checkbox',
    },
    {
      name: 'uniqueId',
      type: 'text',
    },
    {
      name: 'someNestedObject',
      type: 'code',
      admin: {
        hidden: true,
      },
    },
  ],
}
