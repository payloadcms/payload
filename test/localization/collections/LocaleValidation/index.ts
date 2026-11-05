import type { Block, CollectionConfig, Field, Validate } from 'payload'

import { localeValidationBlockSlug, localeValidationSlug } from '../../shared.js'

type ValidationData = {
  confirmation?: string
  localizedJSON?: { en?: string }
  settings?: { rows?: { confirmation?: string }[] }
  sharedJSON?: { en?: string }
}

const validateMatchingText: Validate<string, ValidationData, ValidationData> = (
  value,
  { data, siblingData },
) =>
  !value ||
  (value === data.confirmation && value === siblingData.confirmation) ||
  'Translations do not match'

export const LocaleValidationBlock: Block = {
  slug: localeValidationBlockSlug,
  fields: [
    { name: 'confirmation', type: 'text', localized: true },
    {
      name: 'nested',
      type: 'group',
      fields: [
        { name: 'confirmation', type: 'text', localized: true },
        {
          name: 'matchingText',
          type: 'text',
          localized: true,
          validate: ((value, { blockData, data, siblingData }) =>
            !value ||
            (value === data.confirmation &&
              value === blockData.confirmation &&
              value === siblingData.confirmation) ||
            'Block translations do not match') satisfies Validate<
            string,
            ValidationData,
            ValidationData
          >,
        },
      ],
    },
  ],
}

export const getLocaleValidationFields = (): Field[] => [
  { name: 'confirmation', type: 'text', localized: true },
  { name: 'matchingText', type: 'text', localized: true, validate: validateMatchingText },
  { name: 'sharedJSON', type: 'json' },
  { name: 'localizedJSON', type: 'json', localized: true },
  {
    name: 'jsonText',
    type: 'text',
    localized: true,
    validate: ((value, { data }) =>
      !value ||
      (value === data.localizedJSON?.en && data.sharedJSON?.en === 'shared JSON') ||
      'JSON context does not match') satisfies Validate<string, ValidationData, ValidationData>,
  },
  {
    name: 'arrayText',
    type: 'text',
    localized: true,
    validate: ((value, { data }) =>
      !value ||
      value === data.settings?.rows?.[0]?.confirmation ||
      'Array context does not match') satisfies Validate<string, ValidationData, ValidationData>,
  },
  {
    type: 'tabs',
    tabs: [
      {
        name: 'settings',
        fields: [
          {
            name: 'rows',
            type: 'array',
            fields: [{ name: 'confirmation', type: 'text', localized: true }],
          },
        ],
      },
    ],
  },
  { name: 'layout', type: 'blocks', blocks: [localeValidationBlockSlug] },
]

export const LocaleValidation: CollectionConfig = {
  slug: localeValidationSlug,
  fields: getLocaleValidationFields(),
}
