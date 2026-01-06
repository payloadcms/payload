import type { CollectionConfig, TextFieldSingleValidation } from 'payload'

import { collectionSlugs } from '../../shared.js'

export const ValidateDraftsOn: CollectionConfig = {
  slug: collectionSlugs.validateDraftsOn as 'validate-drafts-on',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'failValidation',
      type: 'checkbox',
      admin: {
        description:
          'Check this box to simulate a validation failure. The save button should remain enabled after the failure.',
      },
      defaultValue: false,
    },
    {
      name: 'validatedField',
      type: 'text',
      admin: {
        description:
          'This field will fail validation if "Fail Validation" checkbox is checked. This simulates validation failures from business logic, network errors, or third-party validation.',
      },
      validate: ((value, { data }) => {
        if ((data as any)?.failValidation) {
          return 'Validation failed: simulated validation error to test save button behavior.'
        }
        return true
      }) as TextFieldSingleValidation,
    },
  ],
  versions: {
    drafts: {
      validate: true,
    },
  },
}
