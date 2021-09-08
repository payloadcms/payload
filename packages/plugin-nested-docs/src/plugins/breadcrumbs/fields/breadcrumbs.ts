import { Field } from 'payload/types';
import deepMerge from '../../../utilities/deepMerge';

const createBreadcrumbsField = (relationTo: string, overrides: Partial<Field> = {}): Field => deepMerge({
  name: 'breadcrumbs',
  type: 'array',
  fields: [
    {
      name: 'doc',
      type: 'relationship',
      relationTo,
      maxDepth: 0,
      admin: {
        disabled: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
  ],
  admin: {
    readOnly: true,
  },
}, overrides);

export default createBreadcrumbsField;
