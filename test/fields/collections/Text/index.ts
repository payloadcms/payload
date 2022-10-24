import type { CollectionConfig } from '../../../../src/collections/config/types';

export const defaultText = 'default-text';

const TextFields: CollectionConfig = {
  slug: 'text-fields',
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
      name: 'localizedText',
      type: 'text',
      localized: true,
    },
    {
      name: 'defaultFunction',
      type: 'text',
      defaultValue: () => (defaultText),
    },
    {
      name: 'defaultAsync',
      type: 'text',
      defaultValue: async (): Promise<string> => {
        return new Promise((resolve) => setTimeout(() => {
          resolve(defaultText);
        }, 1));
      },
    },
    {
      name: 'Override the 40k text length default (This one has 50k max length)',
      type: 'text',
      maxLength: 50000,
    },
  ],
};

export const textDoc = {
  text: 'Seeded text document',
  localizedText: 'Localized text',
};

export default TextFields;
