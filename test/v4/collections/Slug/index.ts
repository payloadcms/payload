import type { CollectionConfig, TextField } from 'payload'

import { slugField } from 'payload'

import { slugFieldsSlug } from '../../slugs.js'

const SlugFields: CollectionConfig = {
  slug: slugFieldsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      defaultValue: 'Example Title',
    },
    slugField({
      overrides: (field) => {
        const textField = field.fields[1] as TextField
        textField.label = 'Default Slug'
        textField.admin = {
          ...textField.admin,
          description: 'This is the default slug field',
        }
        return field
      },
    }),
    {
      name: 'requiredTitle',
      type: 'text',
      label: 'Required Title',
      required: true,
      defaultValue: 'Required Example Title',
    },
    slugField({
      name: 'requiredSlug',
      useAsSlug: 'requiredTitle',
      checkboxName: 'generateRequiredSlug',
      required: true,
      overrides: (field) => {
        const textField = field.fields[1] as TextField
        textField.label = 'Required Slug'
        return field
      },
    }),
    {
      name: 'readOnlyTitle',
      type: 'text',
      label: 'Read Only Title',
      defaultValue: 'Read Only Title Value',
      admin: {
        readOnly: true,
      },
    },
    slugField({
      name: 'readOnlySlug',
      useAsSlug: 'readOnlyTitle',
      checkboxName: 'generateReadOnlySlug',
      overrides: (field) => {
        const textField = field.fields[1] as TextField
        textField.label = 'Read Only Slug'
        textField.defaultValue = 'read-only-slug-value'
        textField.admin = {
          ...textField.admin,
          readOnly: true,
        }
        return field
      },
    }),
    {
      type: 'collapsible',
      label: 'More Slug Examples',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'longTitle',
          type: 'text',
          label: 'Long Title',
          defaultValue: 'This is a very long title that should generate a very long slug value',
        },
        slugField({
          name: 'longSlug',
          useAsSlug: 'longTitle',
          checkboxName: 'generateLongSlug',
          overrides: (field) => {
            const textField = field.fields[1] as TextField
            textField.label = 'Long Slug (tests text overflow)'
            textField.admin = {
              ...textField.admin,
              description: 'This slug has a long value to test text-overflow behavior',
            }
            return field
          },
        }),
        {
          name: 'placeholderTitle',
          type: 'text',
          label: 'Placeholder Title',
          defaultValue: 'Placeholder Example Title',
        },
        slugField({
          name: 'placeholderSlug',
          useAsSlug: 'placeholderTitle',
          checkboxName: 'generatePlaceholderSlug',
          overrides: (field) => {
            const textField = field.fields[1] as TextField
            textField.label = 'Slug with Placeholder'
            textField.admin = {
              ...textField.admin,
              placeholder: 'enter-a-slug-here',
            }
            return field
          },
        }),
        {
          name: 'lockedTitle',
          type: 'text',
          label: 'Locked Title',
          defaultValue: 'Locked Example',
        },
        slugField({
          name: 'lockedSlug',
          useAsSlug: 'lockedTitle',
          checkboxName: 'generateLockedSlug',
          overrides: (field) => {
            const textField = field.fields[1] as TextField
            textField.label = 'Locked Slug (default state)'
            textField.defaultValue = 'locked-example'
            textField.admin = {
              ...textField.admin,
              description: 'This slug starts with a value to show the locked state',
            }
            return field
          },
        }),
      ],
    },
  ],
}

export default SlugFields
