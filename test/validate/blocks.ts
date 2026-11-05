import type { Block } from 'payload'

import { defaultDraftValidationBlockSlug } from './shared.js'

export const defaultDraftValidationBlock: Block = {
  slug: defaultDraftValidationBlockSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
}
