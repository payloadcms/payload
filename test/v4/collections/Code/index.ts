import type { CollectionConfig } from 'payload'

import { codeFieldsSlug } from '../../slugs.js'

const CodeFields: CollectionConfig = {
  slug: codeFieldsSlug,
  fields: [
    {
      name: 'javascript',
      type: 'code',
      label: 'JavaScript',
      required: true,
      admin: {
        language: 'javascript',
        description: 'Write JavaScript code',
      },
    },
    {
      name: 'html',
      type: 'code',
      label: 'HTML',
      admin: {
        language: 'html',
        description: 'Write HTML markup',
      },
    },
    {
      name: 'css',
      type: 'code',
      label: 'CSS',
      admin: {
        language: 'css',
        description: 'Write CSS styles',
      },
    },
    {
      name: 'typescript',
      type: 'code',
      label: 'TypeScript',
      admin: {
        language: 'typescript',
        description: 'Write TypeScript code',
      },
    },
    {
      name: 'readOnly',
      type: 'code',
      label: 'Read Only',
      admin: {
        language: 'javascript',
        description: 'This field is read only',
        readOnly: true,
      },
      defaultValue: 'const example = "read only";',
    },
    {
      name: 'disabled',
      type: 'code',
      label: 'Disabled',
      admin: {
        language: 'javascript',
        description: 'This field is disabled',
        disabled: true,
      },
      defaultValue: 'const example = "disabled";',
    },
  ],
}

export default CodeFields
