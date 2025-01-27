import type { User } from 'payload/auth'
import type { Config } from 'payload/config'
import type { Field, RadioField, TextField } from 'payload/types'

import { extractTranslations } from 'payload/utilities'

import { validateUrl } from '../../../lexical/utils/url'

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

export const getBaseFields = (
  config: Config,
  enabledCollections: false | string[],
  disabledCollections: false | string[],
  maxDepth?: number,
): Field[] => {
  let enabledRelations: string[]

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

  const baseFields = [
    {
      name: 'text',
      type: 'text',
      label: translations['fields:textToDisplay'],
      required: true,
    },
    {
      name: 'fields',
      type: 'group',
      admin: {
        style: {
          borderBottom: 0,
          borderTop: 0,
          margin: 0,
          padding: 0,
        },
      },
      fields: [
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
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: translations['fields:enterURL'],
          required: true,
          validate: (value: string) => {
            if (value && !validateUrl(value)) {
              return 'Invalid URL'
            }
          },
        },
      ] as Field[],
    },
  ]

  // Only display internal link-specific fields / options / conditions if there are enabled relations
  if (enabledRelations?.length) {
    ;(baseFields[1].fields[0] as RadioField).options.push({
      label: translations['fields:internalLink'],
      value: 'internal',
    })
    ;(baseFields[1].fields[1] as TextField).admin = {
      condition: ({ fields }) => fields?.linkType !== 'internal',
    }

    baseFields[1].fields.push({
      name: 'doc',
      admin: {
        condition: ({ fields }) => {
          return fields?.linkType === 'internal'
        },
      },
      // when admin.hidden is a function we need to dynamically call hidden with the user to know if the collection should be shown
      type: 'relationship',
      filterOptions:
        !enabledCollections && !disabledCollections
          ? ({ relationTo, user }) => {
              const hidden = config.collections.find(({ slug }) => slug === relationTo).admin.hidden
              if (typeof hidden === 'function' && hidden({ user } as { user: User })) {
                return false
              }
            }
          : null,
      label: translations['fields:chooseDocumentToLink'],
      maxDepth,
      relationTo: enabledRelations,
      required: true,
    })
  }

  baseFields[1].fields.push({
    name: 'newTab',
    type: 'checkbox',
    label: translations['fields:openInNewTab'],
  })

  return baseFields as Field[]
}
