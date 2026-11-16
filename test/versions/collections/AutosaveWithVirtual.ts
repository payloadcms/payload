import type { CollectionConfig, Field, FieldHook } from 'payload'

import { autosaveWithVirtualSlug } from '../slugs.js'

const deriveFromTitle: FieldHook = ({ siblingData }) => {
  const { title } = siblingData

  return typeof title === 'string' && title ? `derived:${title}` : ''
}

const virtualDerivedTitle: Field = {
  name: 'titleDerived',
  type: 'text',
  admin: {
    readOnly: true,
  },
  hooks: {
    afterRead: [deriveFromTitle],
  },
  virtual: true,
}

const AutosaveWithVirtual: CollectionConfig = {
  slug: autosaveWithVirtualSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    virtualDerivedTitle,
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        virtualDerivedTitle,
      ],
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}

export default AutosaveWithVirtual
