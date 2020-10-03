const DescriptionField = require('./components/fields/Description/Field').default;
const DescriptionCell = require('./components/fields/Description/Cell').default;
const DescriptionFilter = require('./components/fields/Description/Filter').default;
const NestedArrayField = require('./components/fields/NestedArrayCustomField/Field').default;
const GroupField = require('./components/fields/Group/Field').default;
const NestedGroupField = require('./components/fields/NestedGroupCustomField/Field').default;
const NestedText1Field = require('./components/fields/NestedText1/Field').default;
const ListView = require('./components/views/List').default;

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
          Field: DescriptionField,
          Cell: DescriptionCell,
          Filter: DescriptionFilter,
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
              Field: NestedArrayField,
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
          Field: GroupField,
        },
      },
      fields: [
        {
          type: 'text',
          name: 'nestedGroupCustomField',
          label: 'Nested Group Custom Field',
          admin: {
            components: {
              Field: NestedGroupField,
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
              Field: NestedText1Field,
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
