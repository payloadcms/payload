import type { Block, BlockField, Field, FieldWithRichTextRequiredEditor } from 'payload/types'

import { baseBlockFields, sanitizeFields } from 'payload/config'
import { fieldsToJSONSchema, formatLabels } from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { BlocksFeatureClientProps } from './feature.client.js'

import { cloneDeep } from '../../lexical/utils/cloneDeep.js'
import { BlocksFeatureClientComponent } from './feature.client.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { blockPopulationPromiseHOC } from './populationPromise.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks: Array<
    Omit<Block, 'fields'> & {
      fields: FieldWithRichTextRequiredEditor[]
    }
  >
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
        generateSchemaMap: ({ config, props, schemaMap: schemaMapFromProps, schemaPath }) => {
          const schemaMap: {
            [key: string]: Field[]
          } = {}

          /**
           * Add sub-fields to the schemaMap. E.g. if you have an array field as part of the block and it runs addRow, it will request these
           * sub-fields from the component map. Thus we need to put them in the component map here.
           */
          const handleFields = (parentPath: string, fields: Field[]) => {
            for (const field of fields) {
              if ('name' in field && 'fields' in field) {
                schemaMap[parentPath + '.' + field.name] = field.fields
                handleFields(parentPath + '.' + field.name, field.fields)
              }
              if ('blocks' in field) {
                for (const block of field.blocks) {
                  schemaMap[parentPath + '.' + field.name + '.' + block.slug] = block.fields || []
                  handleFields(parentPath + '.' + field.name + '.' + block.slug, block.fields)
                }
              }
              if ('tabs' in field) {
                for (const tab of field.tabs) {
                  if ('name' in tab) {
                    schemaMap[parentPath + '.' + tab.name] = tab.fields || []
                    handleFields(parentPath + '.' + tab.name, tab.fields)
                  } else {
                    handleFields(parentPath, tab.fields)
                  }
                }
              }
            }
          }

          for (const block of props.blocks) {
            schemaMap[block.slug] = block.fields || []
            handleFields(block.slug, block.fields)
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
          {
            node: BlockNode,
            populationPromises: [blockPopulationPromiseHOC(props)],
            validations: [blockValidationHOC(props)],
          },
        ],
        serverFeatureProps: props,
      }
    },
    key: 'blocks',
    serverFeatureProps: props,
  }
}
