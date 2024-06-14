import type { Field, SanitizedConfig, User } from 'payload'

export const getBaseFields = (config: SanitizedConfig): Field[] => [
  {
    name: 'text',
    type: 'text',
    label: ({ t }) => t('fields:textToDisplay'),
    required: true,
  },
  {
    name: 'linkType',
    type: 'radio',
    admin: {
      description: ({ t }) => t('fields:chooseBetweenCustomTextOrDocument'),
    },
    defaultValue: 'custom',
    label: ({ t }) => t('fields:linkType'),
    options: [
      {
        label: ({ t }) => t('fields:customURL'),
        value: 'custom',
      },
      {
        label: ({ t }) => t('fields:internalLink'),
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
    label: ({ t }) => t('fields:enterURL'),
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
    label: ({ t }) => t('fields:chooseDocumentToLink'),
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
    label: ({ t }) => t('fields:openInNewTab'),
  },
]
