'use client'

import { getTranslation } from '@payloadcms/translations'

import { InlineFieldsIcon } from '../../lexical/ui/icons/InlineFields/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { InlineFieldsNode } from './nodes/InlineFieldsNode.js'
import { OPEN_INLINE_FIELDS_DRAWER_COMMAND } from './plugin/commands.js'
import { InlineFieldsPlugin } from './plugin/index.js'

export type InlineFieldsFeatureClientProps = {
  inlineFields: {
    key: string
    label: string
  }[]
}

export const InlineFieldsFeatureClient = createClientFeature<InlineFieldsFeatureClientProps>(
  ({ props }) => ({
    nodes: [InlineFieldsNode],
    plugins: [
      {
        Component: InlineFieldsPlugin,
        position: 'normal',
      },
    ],
    sanitizedClientFeatureProps: props,
    slashMenu: {
      groups: [
        {
          items: props.inlineFields.map((inlineField) => {
            return {
              Icon: InlineFieldsIcon,
              key: 'inlineFields-' + inlineField.key,
              keywords: ['field', 'fields', inlineField.key],
              label: ({ i18n }) => {
                if (!inlineField.label) {
                  return inlineField.key
                }

                return getTranslation(inlineField.label, i18n)
              },
              onSelect: ({ editor }) => {
                editor.dispatchCommand(OPEN_INLINE_FIELDS_DRAWER_COMMAND, {
                  fields: {},
                  key: inlineField.key,
                })
              },
            }
          }),
          key: 'inlineFields',
          label: ({ i18n }) => {
            return i18n.t('lexical:inlineFields:label')
          },
        },
      ],
    },
    toolbarFixed: {
      groups: [
        {
          type: 'dropdown',
          ChildComponent: InlineFieldsIcon,
          items: props.inlineFields.map((inlineField, index) => {
            return {
              ChildComponent: InlineFieldsIcon,
              isActive: undefined,
              key: 'inlineFields-' + inlineField.key,
              label: ({ i18n }) => {
                if (!inlineField.label) {
                  return inlineField.key
                }

                return getTranslation(inlineField.label, i18n)
              },
              onSelect: ({ editor }) => {
                editor.dispatchCommand(OPEN_INLINE_FIELDS_DRAWER_COMMAND, {
                  fields: {},
                  key: inlineField.key,
                })
              },
              order: index,
            }
          }),
          key: 'inlineFields',
          order: 25,
        },
      ],
    },
  }),
)
