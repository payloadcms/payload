import type { CollectionConfig } from 'payload'

import { defaultEmail, emailFieldsSlug } from './shared.js'

const EmailFields: CollectionConfig = {
  slug: emailFieldsSlug,
  defaultSort: 'id',
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'localizedEmail',
      type: 'email',
      localized: true,
    },
    {
      name: 'emailWithAutocomplete',
      type: 'email',
      admin: {
        autoComplete: 'username',
      },
    },
    {
      name: 'i18nEmail',
      type: 'email',
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
      name: 'defaultEmail',
      type: 'email',
      defaultValue: defaultEmail,
    },
    {
      name: 'defaultEmptyString',
      type: 'email',
      defaultValue: '',
    },
    {
      name: 'defaultFunction',
      type: 'email',
      defaultValue: () => defaultEmail,
    },
    {
      name: 'defaultAsync',
      type: 'email',
      defaultValue: async (): Promise<string> => {
        return new Promise((resolve) =>
          setTimeout(() => {
            resolve(defaultEmail)
          }, 1),
        )
      },
    },
    {
      name: 'customLabel',
      type: 'email',
      admin: {
        components: {
          Label: '/collections/Email/CustomLabel.js#CustomLabel',
        },
      },
    },
    {
      name: 'customError',
      type: 'email',
      admin: {
        components: {
          Error: '/collections/Email/CustomError.js#CustomError',
        },
      },
    },
    {
      name: 'beforeAndAfterInput',
      type: 'email',
      admin: {
        components: {
          afterInput: ['/collections/Email/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/Email/BeforeInput.js#BeforeInput'],
        },
      },
    },
    {
      name: 'disableListColumnText',
      type: 'email',
      admin: {
        disableListColumn: true,
        disableListFilter: false,
      },
    },
    {
      name: 'disableListFilterText',
      type: 'email',
      admin: {
        disableListColumn: false,
        disableListFilter: true,
      },
    },
  ],
}

export default EmailFields
