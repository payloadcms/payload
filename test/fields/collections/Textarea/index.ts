import type { CollectionConfig } from 'payload'

import { defaultText, textareaFieldsSlug } from './shared.js'

const TextareaFields: CollectionConfig = {
  slug: textareaFieldsSlug,
  admin: {
    useAsTitle: 'text',
  },
  defaultSort: 'id',
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
      hooks: {
        beforeDuplicate: [({ value }) => `${value} - duplicate`],
      },
    },
    {
      name: 'hiddenTextField',
      type: 'textarea',
      hidden: true,
    },
    {
      name: 'adminHiddenTextField',
      type: 'textarea',
      admin: {
        hidden: true,
        description: 'This field should be hidden',
      },
    },
    {
      name: 'disabledTextField',
      type: 'textarea',
      admin: {
        disabled: true,
        description: 'This field should be disabled',
      },
    },
    {
      name: 'localizedText',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'i18nText',
      type: 'textarea',
      admin: {
        description: {
          en: 'en description',
          es: 'es description',
        },
        placeholder: {
          en: 'en placeholder',
          es: 'es placeholder',
        },
      },
      label: {
        en: 'Text en',
        es: 'Text es',
      },
    },
    {
      name: 'defaultString',
      type: 'textarea',
      defaultValue: defaultText,
    },
    {
      name: 'defaultEmptyString',
      type: 'textarea',
      defaultValue: '',
    },
    {
      name: 'defaultFunction',
      type: 'textarea',
      defaultValue: () => defaultText,
    },
    {
      name: 'defaultAsync',
      type: 'textarea',
      defaultValue: async (): Promise<string> => {
        return new Promise((resolve) =>
          setTimeout(() => {
            resolve(defaultText)
          }, 1),
        )
      },
    },
    {
      name: 'overrideLength',
      type: 'textarea',
      label: 'Override the 40k text length default',
      maxLength: 50000,
    },
    {
      name: 'fieldWithDefaultValue',
      type: 'textarea',
      defaultValue: async () => {
        const defaultValue = new Promise((resolve) => setTimeout(() => resolve('some-value'), 1000))

        return defaultValue
      },
    },
    {
      name: 'dependentOnFieldWithDefaultValue',
      type: 'textarea',
      hooks: {
        beforeChange: [
          ({ data }) => {
            return data?.fieldWithDefaultValue || ''
          },
        ],
      },
    },
    {
      name: 'defaultValueFromReq',
      type: 'textarea',
      defaultValue: async ({ req }) => {
        return Promise.resolve(req.context.defaultValue)
      },
    },
  ],
}

export default TextareaFields
