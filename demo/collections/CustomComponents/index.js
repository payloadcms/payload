module.exports = {
  slug: 'custom-components',
  labels: {
    singular: 'Custom Component',
    plural: 'Custom Components',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
      admin: {
        components: {
          field: 'collections/CustomComponents/components/fields/Description/Field/index.js',
          cell: 'collections/CustomComponents/components/fields/Description/Cell/index.js',
          filter: 'collections/CustomComponents/components/fields/Description/Filter/index.js',
        },
      },
    },
    {
      name: 'array',
      label: 'Array',
      type: 'array',
      fields: [
        {
          type: 'text',
          name: 'nestedArrayCustomField',
          label: 'Nested Array Custom Field',
          admin: {
            components: {
              field: 'collections/CustomComponents/components/fields/NestedArrayCustomField/Field/index.js',
            },
          },
        },
      ],
    },
    {
      name: 'group',
      label: 'Group',
      type: 'group',
      admin: {
        components: {
          field: 'collections/CustomComponents/components/fields/Group/Field/index.js',
        },
      },
      fields: [
        {
          type: 'text',
          name: 'nestedGroupCustomField',
          label: 'Nested Group Custom Field',
          admin: {
            components: {
              field: 'collections/CustomComponents/components/fields/NestedGroupCustomField/Field/index.js',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'nestedText1',
          label: 'Nested Text 1',
          type: 'text',
          admin: {
            components: {
              field: 'collections/CustomComponents/components/fields/NestedText1/Field/index.js',
            },
          },
        }, {
          name: 'nestedText2',
          label: 'Nested Text 2',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    components: {
      views: {
        List: 'collections/CustomComponents/components/views/List/index.js',
      },
    },
  },
};
