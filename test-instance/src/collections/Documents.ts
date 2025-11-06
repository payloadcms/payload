import type { CollectionConfig } from 'payload'

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'category', 'updatedAt'],
  },
  upload: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Report', value: 'report' },
        { label: 'Presentation', value: 'presentation' },
        { label: 'Spreadsheet', value: 'spreadsheet' },
        { label: 'Contract', value: 'contract' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If unchecked, signed URLs will be required to access this document',
      },
    },
  ],
}
