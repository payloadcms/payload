import type { CollectionConfig } from 'payload'

import { selectFieldsSlug } from '../../slugs.js'

const SelectFields: CollectionConfig = {
  slug: selectFieldsSlug,
  fields: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      admin: {
        description: 'The current publication status of this post',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'statusRequired',
      type: 'select',
      label: 'Status',
      required: true,
      admin: {
        description: 'The current publication status of this post',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'statusDisabled',
      type: 'select',
      label: 'Status (Disabled)',
      defaultValue: 'draft',
      admin: {
        disabled: true,
        description: 'This field is disabled',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'statusReadOnly',
      type: 'select',
      label: 'Status (Read Only)',
      defaultValue: 'published',
      admin: {
        readOnly: true,
        description: 'This field is read-only',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'tags',
      type: 'select',
      label: 'Tags',
      hasMany: true,
      admin: {
        description: 'Select multiple tags',
      },
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
      ],
    },
    {
      name: 'tagsRequired',
      type: 'select',
      label: 'Tags (Required)',
      hasMany: true,
      required: true,
      admin: {
        description: 'At least one tag is required',
      },
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
      ],
    },
    {
      name: 'tagsReadOnly',
      type: 'select',
      label: 'Tags (Read Only)',
      hasMany: true,
      defaultValue: ['technology', 'design'],
      admin: {
        readOnly: true,
        description: 'These tags cannot be changed',
      },
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
      ],
    },
    {
      name: 'tagsWithManyValues',
      type: 'select',
      label: 'Tags (Many Values)',
      hasMany: true,
      defaultValue: ['technology', 'design', 'marketing', 'engineering', 'product'],
      admin: {
        description: 'Has many values to test wrapping',
      },
      options: [
        { label: 'Technology', value: 'technology' },
        { label: 'Design', value: 'design' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Engineering', value: 'engineering' },
        { label: 'Product', value: 'product' },
      ],
    },
  ],
}

export default SelectFields
