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
        someObject: props?.someObject,
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
          someObject: fields?.someObject,
        },
      }
    },
  },
  fields: [
    {
      name: 'packageId',
      type: 'textarea',
    },
    {
      name: 'global',
      type: 'checkbox',
    },
    {
      name: 'someObject',
      type: 'json',
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
