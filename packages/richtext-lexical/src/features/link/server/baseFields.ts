import type {
  CollectionSlug,
  FieldAffectingData,
  RadioField,
  SanitizedConfig,
  TextField,
  TextFieldSingleValidation,
  User,
} from 'payload'

import type { LinkFields } from '../nodes/types.js'

import { validateUrl, validateUrlMinimal } from '../../../lexical/utils/url.js'

export const getBaseFields = (
  config: SanitizedConfig,
  enabledCollections?: CollectionSlug[],
  disabledCollections?: CollectionSlug[],
  maxDepth?: number,
): FieldAffectingData[] => {
  let enabledRelations: CollectionSlug[]

  /**
   * Figure out which relations should be enabled (enabledRelations) based on a collection's admin.enableRichTextLink property,
   * or the Link Feature's enabledCollections and disabledCollections properties which override it.
   */
  if (enabledCollections) {
    enabledRelations = enabledCollections
  } else if (disabledCollections) {
    enabledRelations = config.collections
      .filter(({ slug }) => !disabledCollections.includes(slug))
      .map(({ slug }) => slug)
  } else {
    enabledRelations = config.collections
      .filter(({ admin: { enableRichTextLink, hidden } }) => {
        if (typeof hidden !== 'function' && hidden) {
          return false
        }
        return enableRichTextLink
      })
      .map(({ slug }) => slug)
  }

  const baseFields: FieldAffectingData[] = [
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
      ],
      required: true,
    } as RadioField,
    {
      name: 'url',
      type: 'text',
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value) {
              return
            }

            if (!validateUrl(value)) {
              return encodeURIComponent(value)
            }
            return value
          },
        ],
      },
      label: ({ t }) => t('fields:enterURL'),
      required: true,
      validate: ((value: string, options) => {
        if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
          return // no validation needed, as no url should exist for internal links
        }
        if (!validateUrlMinimal(value)) {
          return 'Invalid URL'
        }
      }) as TextFieldSingleValidation,
    },
  ]

  // Only display internal link-specific fields / options / conditions if there are enabled relations
  if (enabledRelations?.length) {
    ;(baseFields[1] as RadioField).options.push({
      label: ({ t }) => t('fields:internalLink'),
      value: 'internal',
    })
    ;(baseFields[2] as TextField).admin = {
      condition: (_data, _siblingData) => {
        return _siblingData.linkType !== 'internal'
      },
    }

    baseFields.push({
      name: 'doc',
      admin: {
        condition: (_data, _siblingData) => {
          return _siblingData.linkType === 'internal'
        },
      },
      // when admin.hidden is a function we need to dynamically call hidden with the user to know if the collection should be shown
      type: 'relationship',
      filterOptions:
        !enabledCollections && !disabledCollections
          ? ({ relationTo, user }) => {
              const hidden = config.collections.find(({ slug }) => slug === relationTo)?.admin
                .hidden
              if (typeof hidden === 'function' && hidden({ user } as { user: User })) {
                return false
              }
              return true
            }
          : null,
      label: ({ t }) => t('fields:chooseDocumentToLink'),
      maxDepth,
      relationTo: enabledRelations,
      required: true,
    })
  }

  baseFields.push({
    name: 'newTab',
    type: 'checkbox',
    label: ({ t }) => t('fields:openInNewTab'),
  })

  return baseFields
}
