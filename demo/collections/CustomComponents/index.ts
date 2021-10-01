import { CollectionConfig } from '../../../src/collections/config/types';
import DescriptionField from './components/fields/Description/Field';
import DescriptionCell from './components/fields/Description/Cell';
import DescriptionFilter from './components/fields/Description/Filter';
import NestedArrayField from './components/fields/NestedArrayCustomField/Field';
import GroupField from './components/fields/Group/Field';
import NestedGroupField from './components/fields/NestedGroupCustomField/Field';
import NestedText1Field from './components/fields/NestedText1/Field';
import ListView from './components/views/List';
import CustomDescriptionComponent from '../../customComponents/Description';

const CustomComponents: CollectionConfig = {
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
      name: 'componentDescription',
      label: 'Component ViewDescription',
      type: 'text',
      admin: {
        description: CustomDescriptionComponent,
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

export default CustomComponents;
