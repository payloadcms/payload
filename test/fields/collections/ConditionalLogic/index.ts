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
  ],
};

export const conditionalLogicDoc = {
  text: 'Seeded conditional logic document',
  toggleField: true,
  fieldToToggle: 'spiderman',
};

export default ConditionalLogic;
