const DescriptionField = require('./components/fields/Description/Field');
const DescriptionCell = require('./components/fields/Description/Cell');
const DescriptionFilter = require('./components/fields/Description/Filter');
const NestedArrayField = require('./components/fields/NestedArrayCustomField/Field');
const GroupField = require('./components/fields/Group/Field');
const NestedGroupField = require('./components/fields/NestedGroupCustomField/Field');
const NestedText1Field = require('./components/fields/NestedText1/Field');
const ListView = require('./components/views/List');

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
          field: DescriptionField,
          cell: DescriptionCell,
          filter: DescriptionFilter,
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
              field: NestedArrayField,
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
          field: GroupField,
        },
      },
      fields: [
        {
          type: 'text',
          name: 'nestedGroupCustomField',
          label: 'Nested Group Custom Field',
          admin: {
            components: {
              field: NestedGroupField,
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
              field: NestedText1Field,
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
        List: ListView,
      },
    },
  },
};
