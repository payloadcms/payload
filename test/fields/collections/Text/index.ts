import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'
import { AfterInput } from './AfterInput'
import { BeforeInput } from './BeforeInput'
import CustomError from './CustomError'
import CustomLabel from './CustomLabel'
import { defaultText, textFieldsSlug } from './shared'

import { textFieldsSlug } from '../../slugs'

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
      label: 'Override the 40k text length default',
      name: 'overrideLength',
      type: 'text',
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
      name: 'customLabel',
      type: 'text',
      admin: {
        components: {
          Label: CustomLabel,
        },
      },
    },
    {
      name: 'customError',
      type: 'text',
      minLength: 3,
      admin: {
        components: {
          Error: CustomError,
        },
      },
    },
    {
      name: 'beforeAndAfterInput',
      type: 'text',
      admin: {
        components: {
          BeforeInput: [BeforeInput],
          AfterInput: [AfterInput],
        },
      },
    },
  ],
}

export default TextFields
