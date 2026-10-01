import type { CollectionConfig } from 'payload'

import { slugFieldsSlug } from '../../slugs.js'

const SlugFields: CollectionConfig = {
  slug: slugFieldsSlug,
  fields: [
    { name: 'title', type: 'text', label: 'Title', defaultValue: 'Example Title' },
    {
      name: 'slug',
      type: 'slug',
      label: 'Default Slug',
      useAsSlug: 'title',
      admin: { description: 'This is the default slug field' },
    },
    {
      name: 'requiredTitle',
      type: 'text',
      label: 'Required Title',
      required: true,
      defaultValue: 'Required Example Title',
    },
    {
      name: 'requiredSlug',
      type: 'slug',
      label: 'Required Slug',
      required: true,
      useAsSlug: 'requiredTitle',
    },
    {
      name: 'readOnlyTitle',
      type: 'text',
      label: 'Read Only Title',
      defaultValue: 'Read Only Title Value',
      admin: { readOnly: true },
    },
    {
      name: 'readOnlySlug',
      type: 'slug',
      label: 'Read Only Slug',
      defaultValue: 'read-only-slug-value',
      useAsSlug: 'readOnlyTitle',
      admin: { readOnly: true },
    },
    {
      type: 'collapsible',
      label: 'More Slug Examples',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'longTitle',
          type: 'text',
          label: 'Long Title',
          defaultValue: 'This is a very long title that should generate a very long slug value',
        },
        {
          name: 'longSlug',
          type: 'slug',
          label: 'Long Slug (tests text overflow)',
          useAsSlug: 'longTitle',
          admin: { description: 'This slug has a long value to test text-overflow behavior' },
        },
        {
          name: 'placeholderTitle',
          type: 'text',
          label: 'Placeholder Title',
          defaultValue: 'Placeholder Example Title',
        },
        {
          name: 'placeholderSlug',
          type: 'slug',
          label: 'Slug with Placeholder',
          useAsSlug: 'placeholderTitle',
          admin: { placeholder: 'enter-a-slug-here' },
        },
        {
          name: 'lockedTitle',
          type: 'text',
          label: 'Locked Title',
          defaultValue: 'Locked Example',
        },
        {
          name: 'lockedSlug',
          type: 'slug',
          label: 'Locked Slug (default state)',
          defaultValue: 'locked-example',
          useAsSlug: 'lockedTitle',
          admin: { description: 'This slug starts with a value to show the locked state' },
        },
      ],
    },
  ],
  versions: false,
}

export default SlugFields
