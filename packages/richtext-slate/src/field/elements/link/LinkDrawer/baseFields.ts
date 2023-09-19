import type { Config } from 'payload/config'
import type { Field } from 'payload/types'

import { extractTranslations } from 'payload/utilities'

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
    name: 'text',
    label: translations['fields:textToDisplay'],
    required: true,
    type: 'text',
  },
  {
    name: 'linkType',
    admin: {
      description: translations['fields:chooseBetweenCustomTextOrDocument'],
    },
    defaultValue: 'custom',
    label: translations['fields:linkType'],
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
    name: 'url',
    admin: {
      condition: ({ linkType }) => linkType !== 'internal',
    },
    label: translations['fields:enterURL'],
    required: true,
    type: 'text',
  },
  {
    name: 'doc',
    admin: {
      condition: ({ linkType }) => {
        return linkType === 'internal'
      },
    },
    label: translations['fields:chooseDocumentToLink'],
    relationTo: config.collections
      .filter(({ admin: { enableRichTextLink } }) => enableRichTextLink)
      .map(({ slug }) => slug),
    required: true,
    type: 'relationship',
  },
  {
    name: 'newTab',
    label: translations['fields:openInNewTab'],
    type: 'checkbox',
  },
]
