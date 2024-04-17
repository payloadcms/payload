import type { Block, BlockField, Field, FieldWithRichTextRequiredEditor } from 'payload/types'

import { traverseFields } from '@payloadcms/next/utilities'
import { baseBlockFields, sanitizeFields } from 'payload/config'
import { fieldsToJSONSchema, formatLabels } from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { BlocksFeatureClientProps } from './feature.client.js'

import { cloneDeep } from '../../lexical/utils/cloneDeep.js'
import { createNode } from '../typeUtilities.js'
import { BlocksFeatureClientComponent } from './feature.client.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { blockPopulationPromiseHOC } from './populationPromise.js'
import { blockValidationHOC } from './validate.js'

export type LexicalBlock = Omit<Block, 'fields'> & {
  fields: FieldWithRichTextRequiredEditor[]
}

export type BlocksFeatureProps = {
  blocks: LexicalBlock[]
}

export const BlocksFeature: FeatureProviderProviderServer<
  BlocksFeatureProps,
  BlocksFeatureClientProps
> = (props) => {
  // Sanitization taken from payload/src/fields/config/sanitize.ts

  if (props?.blocks?.length) {
    props.blocks = props.blocks.map((block) => {
      const blockCopy = cloneDeep(block)

      return {
        ...blockCopy,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        fields: blockCopy.fields.concat(baseBlockFields as FieldWithRichTextRequiredEditor[]),
        labels: !blockCopy.labels ? formatLabels(blockCopy.slug) : blockCopy.labels,
      }
    })
    //  unSanitizedBlock.fields are sanitized in the React component and not here.
    // That's because we do not have access to the payload config here.
  }

  // Build clientProps
  const clientProps: BlocksFeatureClientProps = {
    reducedBlocks: [],
  }
  for (const block of props.blocks) {
    clientProps.reducedBlocks.push({
      slug: block.slug,
      fieldMap: [],
      imageAltText: block.imageAltText,
      imageURL: block.imageURL,
      labels: block.labels,
    })
  }

  return {
    feature: () => {
      return {
        ClientComponent: BlocksFeatureClientComponent,
        clientFeatureProps: clientProps,
        generateSchemaMap: ({ config, i18n, props }) => {
          const validRelationships = config.collections.map((c) => c.slug) || []

          /**
           * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block, and it runs addRow, it will request these
           * sub-fields from the component map. Thus, we need to put them in the component map here.
           */
          const schemaMap = new Map<string, Field[]>()

          for (const block of props.blocks) {
            schemaMap.set(block.slug, block.fields || [])

            traverseFields({
              config,
              fields: block.fields,
              i18n,
              schemaMap,
              schemaPath: block.slug,
              validRelationships,
            })
          }

          return schemaMap
        },
        generatedTypes: {
          modifyOutputSchema: ({
            collectionIDFieldTypes,
            config,
            currentSchema,
            field,
            interfaceNameDefinitions,
          }) => {
            if (!props?.blocks?.length) {
              return currentSchema
            }

            // sanitize blocks
            const validRelationships = config.collections.map((c) => c.slug) || []

            const sanitizedBlocks = props.blocks.map((block) => {
              const blockCopy = cloneDeep(block)
              return {
                ...blockCopy,
                fields: sanitizeFields({
                  config,
                  fields: blockCopy.fields,
                  requireFieldLevelRichTextEditor: true,
                  validRelationships,
                }),
              }
            })

            const blocksField: BlockField = {
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: sanitizedBlocks,
            }
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema(
              collectionIDFieldTypes,
              [blocksField],
              interfaceNameDefinitions,
              config,
            )

            return currentSchema
          },
        },
        nodes: [
          createNode({
            node: BlockNode,
            populationPromises: [blockPopulationPromiseHOC(props)],
            validations: [blockValidationHOC(props)],
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'blocks',
    serverFeatureProps: props,
  }
}
