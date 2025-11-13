import type { CollectionConfig } from 'payload'

export const draftValidationSlug = 'draft-validation'

/**
 * This collection tests the behavior of draft validation and save button state.
 * Specifically, it tests that the save button remains enabled after a failed save,
 * allowing users to retry without making additional form changes.
 */
export const DraftValidationCollection: CollectionConfig = {
  slug: draftValidationSlug,
  admin: {
    useAsTitle: 'title',
  },
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
      validate: (value, { data }) => {
        // Simulate a validation failure based on the checkbox state
        if (data?.failValidation) {
          return 'Validation failed: This is a simulated validation error to test save button behavior.'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  versions: {
    drafts: {
      validate: true,
    },
  },
}
