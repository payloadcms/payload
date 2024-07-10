import type { Config, Field } from 'payload'
import type React from 'react'

import { sanitizeFields } from 'payload'

import type { InlineFieldsFeatureClientProps } from './feature.client.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { InlineFieldsFeatureClient } from '../../exports/client/index.js'
import { createServerFeature } from '../../utilities/createServerFeature.js'
import { createNode } from '../typeUtilities.js'
import { inlineFieldsPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { InlineFieldsNode } from './nodes/InlineFieldsNode.js'
import { inlineFieldsValidationHOC } from './validate.js'

export type InlineFieldsFeatureProps = {
  inlineFields: Array<{
    display?:
      | ((props: { data: Record<string, any> }) => Promise<React.FC | string> | (React.FC | string))
      | React.FC
      | string
    fields: Field[]
    key: string
    label: string
  }>
}

export const InlineFieldsFeature = createServerFeature<
  InlineFieldsFeatureProps,
  InlineFieldsFeatureProps,
  InlineFieldsFeatureClientProps
>({
  feature: async ({ config: _config, isRoot, props }) => {
    if (props?.inlineFields?.length) {
      const validRelationships = _config.collections.map((c) => c.slug) || []

      for (const inlineFields of props.inlineFields) {
        inlineFields.fields = await sanitizeFields({
          config: _config as unknown as Config,
          fields: inlineFields.fields,
          requireFieldLevelRichTextEditor: isRoot,
          validRelationships,
        })
      }
    }

    // Build clientProps
    const clientProps: InlineFieldsFeatureClientProps = {
      inlineFields: [],
    }
    for (const inlineField of props.inlineFields) {
      clientProps.inlineFields.push({
        key: inlineField.key,
        label: inlineField.label,
      })
    }

    return {
      ClientFeature: InlineFieldsFeatureClient,
      clientFeatureProps: clientProps,
      generateSchemaMap: ({ props }) => {
        const schemaMap = new Map<string, Field[]>()

        for (const inlineFields of props.inlineFields) {
          schemaMap.set(inlineFields.key, inlineFields.fields || [])
        }

        return schemaMap
      },
      i18n,
      nodes: [
        createNode({
          getSubFields: ({ node }) => {
            const inlineFieldKey = node.key

            const inlineFields = props.inlineFields.find(
              (inlineField) => inlineField.key === inlineFieldKey,
            )
            return inlineFields?.fields
          },
          getSubFieldsData: ({ node }) => {
            return node?.fields
          },
          graphQLPopulationPromises: [inlineFieldsPopulationPromiseHOC(props)],
          hooks: {
            afterRead: [
              async ({ node }) => {
                console.log('running node hook', node)
                const inlineField = props.inlineFields.find(
                  (inlineField) => inlineField.key === node.key,
                )
                const display = inlineField?.display
                if (!display) {
                  return node
                }

                if (typeof display === 'string') {
                  node.fields._internal_text_output = display
                  return node
                }

                if (typeof display !== 'function') {
                  // Is React.FC
                  const Component: React.FC = display
                  node.fields._internal_text_output = <Component />
                  return node
                }

                if (typeof display === 'function') {
                  const componentOrString: React.FC | string = (await display({
                    data: node.fields,
                  })) as unknown as React.FC | string

                  if (typeof componentOrString === 'string') {
                    node.fields._internal_text_output = componentOrString
                    return node
                  } else {
                    const Component: React.FC = componentOrString
                    node.fields._internal_text_output = <Component />
                    return node
                  }
                }
                node.fields._internal_text_output = 'hi'
                return node
              },
            ],
          },
          node: InlineFieldsNode,
          validations: [inlineFieldsValidationHOC(props)],
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },

  key: 'inlineFields',
})
