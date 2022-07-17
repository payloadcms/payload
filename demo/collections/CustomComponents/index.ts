import { CollectionConfig } from '../../../src/collections/config/types';
import DescriptionField from './components/fields/Description/Field';
import TextField from './components/fields/Text/Field';
import SelectField from './components/fields/Select/Field';
import TextAreaField from './components/fields/TextArea/Field';
import UploadField from './components/fields/Upload/Field';
import DescriptionCell from './components/fields/Description/Cell';
import DescriptionFilter from './components/fields/Description/Filter';
import NestedArrayField from './components/fields/NestedArrayCustomField/Field';
import GroupField from './components/fields/Group/Field';
import NestedGroupField from './components/fields/NestedGroupCustomField/Field';
import NestedText1Field from './components/fields/NestedText1/Field';
import UIField from './components/fields/UI/Field';
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
    },
    {
      name: 'normalText',
      label: 'Normal text field',
      type: 'text',
      // required: true,
    },
    {
      name: 'customText',
      label: 'Custom text field (removes whitespace)',
      type: 'text',
      // required: true,
      admin: {
        components: {
          Field: TextField,
        },
      },
    },
    {
      name: 'normalSelect',
      label: 'Normal select field',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: '1',
        },
        {
          label: 'Option 2',
          value: '2',
        },
        {
          label: 'Option 3',
          value: '3',
        },
      ],
    },
    {
      name: 'customSelect',
      label: 'Custom select field (syncs value with crm)',
      type: 'select',
      options: [
        {
          label: 'Option 1',
          value: '1',
        },
        {
          label: 'Option 2',
          value: '2',
        },
        {
          label: 'Option 3',
          value: '3',
        },
      ],
      admin: {
        components: {
          Field: SelectField,
        },
      },
    },
    {
      name: 'normalTextarea',
      label: 'Normal textarea field',
      type: 'textarea',
    },
    {
      name: 'customTextarea',
      label: 'Custom textarea field',
      type: 'textarea',
      admin: {
        components: {
          Field: TextAreaField,
        },
      },
    },
    {
      name: 'ui',
      label: 'UI',
      type: 'ui',
      admin: {
        components: {
          Field: UIField,
        },
      },
    },
    {
      name: 'normalUpload',
      label: 'Normal upload field',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'customUpload',
      label: 'Custom upload field',
      type: 'upload',
      relationTo: 'media',
      admin: {
        components: {
          Field: UploadField,
        },
      },
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
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
        },
        {
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
