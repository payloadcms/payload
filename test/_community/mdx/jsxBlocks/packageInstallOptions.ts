import type { Block } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { bannerTypes } from '../../collections/Posts/shared.js'

export const PackageInstallOptions: Block = {
  slug: 'PackageInstallOptions',
  jsx: {
    import: ({ props, children, markdownToLexical }) => {
      console.log('Importing')
      return {
        packageId: props?.packageId,
        global: props?.global,
        update: props?.update,
        uniqueId: props?.uniqueId,
      }
    },
    export: ({ fields, lexicalToMarkdown }) => {
      return {
        props: {
          packageId: fields?.packageId,
          global: fields?.global,
          update: fields?.update,
          uniqueId: fields?.uniqueId,
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
  ],
}
