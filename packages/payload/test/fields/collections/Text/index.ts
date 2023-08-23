import type { CollectionConfig } from '../../../../src/collections/config/types';

export const defaultText = 'default-text';
export const textFieldsSlug = 'text-fields';

const TextFields: CollectionConfig = {
  slug: textFieldsSlug,
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
      name: 'i18nText',
      type: 'text',
      label: {
        en: 'Text en',
        es: 'Text es',
      },
      admin: {
        placeholder: {
          en: 'en placeholder',
          es: 'es placeholder',
        },
        description: {
          en: 'en description',
          es: 'es description',
        },
      },
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
      label: 'Override the 40k text length default',
      name: 'overrideLength',
      type: 'text',
      maxLength: 50000,
    },
    {
      name: 'fieldWithDefaultValue',
      type: 'text',
      defaultValue: async () => {
        const defaultValue = new Promise((resolve) => setTimeout(() => resolve('some-value'), 1000));

        return defaultValue;
      },
    },
    {
      name: 'dependentOnFieldWithDefaultValue',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ data }) => {
            return data?.fieldWithDefaultValue || '';
          },
        ],
      },
    },
  ],
};

export const textDoc = {
  text: 'Seeded text document',
  localizedText: 'Localized text',
};

export default TextFields;
