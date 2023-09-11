import type { Config } from 'payload'
import type { Field } from 'payload'

import { extractTranslations } from 'payload'

const translations = extractTranslations([
  'fields:textToDisplay',
  'fields:linkType',
  'fields:chooseBetweenCustomTextOrDocument',
  'fields:customURL',
  'fields:internalLink',
  'fields:enterURL',
  'fields:chooseDocumentToLink',
  'fields:openInNewTab',
])

export const getBaseFields = (config: Config): Field[] => [
  {
    label: translations['fields:textToDisplay'],
    name: 'text',
    required: true,
    type: 'text',
  },
  {
    admin: {
      description: translations['fields:chooseBetweenCustomTextOrDocument'],
    },
    defaultValue: 'custom',
    label: translations['fields:linkType'],
    name: 'linkType',
    options: [
      {
        label: translations['fields:customURL'],
        value: 'custom',
      },
      {
        label: translations['fields:internalLink'],
        value: 'internal',
      },
    ],
    required: true,
    type: 'radio',
  },
  {
    admin: {
      condition: ({ linkType }) => linkType !== 'internal',
    },
    label: translations['fields:enterURL'],
    name: 'url',
    required: true,
    type: 'text',
  },
  {
    admin: {
      condition: ({ linkType }) => {
        return linkType === 'internal'
      },
    },
    label: translations['fields:chooseDocumentToLink'],
    name: 'doc',
    relationTo: config.collections
      .filter(({ admin: { enableRichTextLink } }) => enableRichTextLink)
      .map(({ slug }) => slug),
    required: true,
    type: 'relationship',
  },
  {
    label: translations['fields:openInNewTab'],
    name: 'newTab',
    type: 'checkbox',
  },
]
