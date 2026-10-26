import type { CollectionConfig } from 'payload'

import { defaultText, textFieldsSlug } from './shared.js'

const TextFields: CollectionConfig = {
  slug: textFieldsSlug,
  admin: {
    useAsTitle: 'text',
  },
  defaultSort: 'id',
  fields: [
    {
      name: 'text',
      type: 'text',
      required: true,
      hooks: {
        beforeDuplicate: [({ value }) => `${value} - duplicate`],
      },
    },
    {
      name: 'hiddenTextField',
      type: 'text',
      hidden: true,
    },
    {
      name: 'adminHiddenTextField',
      type: 'text',
      admin: {
        hidden: true,
        description: 'This field should be hidden',
      },
    },
    {
      name: 'disabledTextField',
      type: 'text',
      admin: {
        disabled: true,
        description: 'This field should be disabled',
      },
    },
    {
      type: 'row',
      admin: {
        components: {
          Field: './components/CustomField.tsx#CustomField',
        },
      },
      fields: [],
    },
    {
      name: 'localizedText',
      type: 'text',
      localized: true,
    },
    {
      name: 'localizedRequiredText',
      type: 'text',
      localized: true,
      maxLength: 20,
      minLength: 5,
      required: true,
      defaultValue: 'default',
    },
    {
      name: 'localizedCustomValidate',
      type: 'text',
      localized: true,
      validate: (value, { previousValue, req }) => {
        // Only rejects the sentinel, and only for `es` - proves `req.locale` is scoped to the locale being
        // validated (not `'all'`) and that the error is attributed to the right translation.
        if (req.locale === 'es' && value === 'reject-es') {
          return 'rejected for the es locale'
        }

        // Proves `previousValue` is the locale's own prior value, not the whole locale-keyed object.
        if (req.locale === 'en' && value === 'assert-previous' && previousValue !== 'prev-en') {
          return `previousValue was ${JSON.stringify(previousValue)}`
        }

        return true
      },
    },
    {
      name: 'i18nText',
      type: 'text',
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
      type: 'text',
      defaultValue: defaultText,
    },
    {
      name: 'defaultEmptyString',
      type: 'text',
      defaultValue: '',
    },
    {
      name: 'defaultFunction',
      type: 'text',
      defaultValue: () => defaultText,
    },
    {
      name: 'defaultAsync',
      type: 'text',
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
      type: 'text',
      label: 'Override the 40k text length default',
      maxLength: 50000,
    },
    {
      name: 'fieldWithDefaultValue',
      type: 'text',
      defaultValue: async () => {
        const defaultValue = new Promise((resolve) => setTimeout(() => resolve('some-value'), 1000))

        return defaultValue
      },
    },
    {
      name: 'dependentOnFieldWithDefaultValue',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ data }) => {
            return data?.fieldWithDefaultValue || ''
          },
        ],
      },
    },
    {
      name: 'hasMany',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'hasManySecond',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'readOnlyHasMany',
      type: 'text',
      hasMany: true,
      admin: {
        readOnly: true,
      },
      defaultValue: ['default'],
    },
    {
      name: 'validatesHasMany',
      type: 'text',
      hasMany: true,
      minLength: 3,
    },
    {
      name: 'localizedHasMany',
      type: 'text',
      hasMany: true,
      localized: true,
    },
    {
      name: 'withMinRows',
      type: 'text',
      hasMany: true,
      minRows: 2,
    },
    {
      name: 'withMaxRows',
      type: 'text',
      hasMany: true,
      maxRows: 4,
    },
    {
      name: 'defaultValueFromReq',
      type: 'text',
      defaultValue: async ({ req }) => {
        return Promise.resolve(req.context.defaultValue)
      },
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'texts',
          type: 'text',
          hasMany: true,
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'blockWithText',
          fields: [
            {
              name: 'texts',
              type: 'text',
              hasMany: true,
            },
          ],
        },
      ],
    },
  ],
}

export default TextFields
