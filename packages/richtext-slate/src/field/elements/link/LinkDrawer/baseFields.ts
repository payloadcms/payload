import type { User } from 'payload/auth'
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
    type: 'text',
    label: translations['fields:textToDisplay'],
    required: true,
  },
  {
    name: 'linkType',
    type: 'radio',
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
  },
  {
    name: 'url',
    type: 'text',
    admin: {
      condition: ({ linkType }) => linkType !== 'internal',
    },
    label: translations['fields:enterURL'],
    required: true,
  },
  {
    name: 'doc',
    admin: {
      condition: ({ linkType }) => {
        return linkType === 'internal'
      },
    },
    // when admin.hidden is a function we need to dynamically call hidden with the user to know if the collection should be shown
    type: 'relationship',
    filterOptions: ({ relationTo, user }) => {
      const hidden = config.collections.find(({ slug }) => slug === relationTo).admin.hidden
      if (typeof hidden === 'function' && hidden({ user } as { user: User })) {
        return false
      }
    },
    label: translations['fields:chooseDocumentToLink'],
    relationTo: config.collections
      .filter(({ admin: { enableRichTextLink, hidden } }) => {
        if (typeof hidden !== 'function' && hidden) {
          return false
        }
        return enableRichTextLink
      })
      .map(({ slug }) => slug),
    required: true,
  },
  {
    name: 'newTab',
    type: 'checkbox',
    label: translations['fields:openInNewTab'],
  },
]
