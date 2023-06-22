import type { CollectionConfig } from '../../../../src/collections/config/types';

const ConditionalLogic: CollectionConfig = {
  slug: 'conditional-logic',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
    },
    {
      name: 'toggleField',
      type: 'checkbox',
    },
    {
      name: 'fieldToToggle',
      type: 'text',
      required: true,
      admin: {
        condition: ({ toggleField }) => Boolean(toggleField),
      },
    },
    {
      name: 'userConditional',
      type: 'text',
      admin: {
        condition: (_data, _siblingData, { user }) => {
          return Boolean(user?.canViewConditionalField);
        },
      },
    },
    {
      name: 'parentGroup',
      type: 'group',
      fields: [
        {
          name: 'toggleSiblingField',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'siblingField',
          type: 'text',
          admin: {
            description: 'This conditional field ensures it can rely on nested fields inside `data` i.e. `data.parentGroup.toggleSiblingField`.',
            condition: ({ parentGroup }) => parentGroup?.toggleSiblingField,
          },
        },
      ],
    },
  ],
};

export const conditionalLogicDoc = {
  text: 'Seeded conditional logic document',
  toggleField: true,
  fieldToToggle: 'spiderman',
};

export default ConditionalLogic;
