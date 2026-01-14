import type { CollectionConfig, FilterOptions } from 'payload'

export const filterByMimeType = (mimeType: string): FilterOptions => {
  return {
    mimeType: {
      contains: mimeType,
    },
  }
}

export const ContractorAppContent: CollectionConfig = {
  slug: 'payload-contractor-app-content',
  dbName: 'contractor-app-content',
  labels: {
    singular: 'Contractor App Content',
    plural: 'Contractor App Contents',
  },
  admin: {
    enableRichTextRelationship: false,
    defaultColumns: ['title', 'updatedAt', 'createdAt'],
    components: {
      edit: {
        // beforeDocumentControls: ['@/components/RelationHeader/RelationHeader'],
      },
    },
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    // beforeValidate: [validateUnpublishPermission],
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 256,
      required: true,
    },
    {
      name: 'heroBanner',
      label: 'Hero Banner',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'text',
          required: true,
        },
        {
          name: 'image',
          label: 'Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: filterByMimeType('image'),
        },
        // {
        //   name: 'action',
        //   label: 'Action',
        //   type: 'relationship',
        //   relationTo: 'payload-link',
        //   required: true,
        //   hasMany: false,
        // },
      ],
    },
    {
      name: 'section1',
      label: 'Section 1',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'brands',
          label: 'Brands',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 5,
          fields: [
            {
              name: 'brandImage',
              label: 'Brand Image',
              type: 'relationship',
              relationTo: 'media',
              required: true,
              hasMany: false,
              filterOptions: filterByMimeType('image'),
            },
          ],
        },
      ],
    },
    {
      name: 'section2',
      label: 'Section 2',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'richText',
          required: true,
        },
        {
          name: 'media',
          label: 'media',
          type: 'upload',
          relationTo: 'media',
          required: false,
          filterOptions: filterByMimeType('video/mp4'),
        },
        {
          name: 'howItWorksUrl',
          label: 'How it Works Url',
          type: 'text',
          maxLength: 256,
          required: false,
          unique: true,
          // validate: urlValidation(true),
        },
      ],
    },
    {
      name: 'section3',
      label: 'Section 3',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'richText',
          required: true,
        },
        // {
        //   name: 'action',
        //   label: 'Action',
        //   type: 'relationship',
        //   relationTo: 'payload-link',
        //   required: true,
        //   hasMany: false,
        // },
        {
          name: 'media',
          label: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: filterByMimeType('image'),
        },
      ],
    },
    {
      name: 'section4',
      label: 'Section 4',
      type: 'group',
      fields: [
        {
          name: 'testimonials',
          label: 'Testimonials',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 1,
          fields: [
            {
              name: 'testimonialTitle',
              label: 'Testimonial Title',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'testimonialDescription',
              label: 'Testimonial Description',
              type: 'richText',
              required: true,
            },
            {
              name: 'testimonialImage',
              label: 'Testimonial Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: filterByMimeType('image'),
            },
          ],
        },
      ],
    },
    {
      name: 'section5',
      label: 'Section 5',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'richText',
          required: true,
        },
        {
          name: 'steps',
          label: 'Steps',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 3,
          fields: [
            {
              name: 'stepTitle',
              label: 'Step Title',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'stepDescription',
              label: 'Step Description',
              type: 'richText',
              required: true,
            },
            {
              name: 'stepImage',
              label: 'Step Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: filterByMimeType('image'),
            },
          ],
        },
      ],
    },
    {
      name: 'section6',
      label: 'Section 6',
      type: 'group',
      fields: [
        {
          name: 'heading',
          label: 'Heading',
          type: 'text',
          maxLength: 256,
          required: true,
        },
        {
          name: 'description',
          label: 'Description',
          type: 'richText',
          required: true,
        },
        {
          name: 'team',
          label: 'Team',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 4,
          fields: [
            {
              name: 'teamMemberName',
              label: 'Team Member Name',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'teamMemberPosition',
              label: 'Team Member Position',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'teamMemberImage',
              label: 'Team Member Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: filterByMimeType('image'),
            },
            {
              name: 'teamMemberAddress',
              label: 'Team Member Address',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'teamMemberPhone',
              label: 'Team Member Phone',
              type: 'text',
              maxLength: 256,
              required: true,
            },
            {
              name: 'teamMemberEmail',
              label: 'Team Member Email',
              type: 'email',
              required: true,
              // validate: (value) => emailValidation(true)([value ?? ''], {} as any),
            },
          ],
        },
      ],
    },
  ],
}
