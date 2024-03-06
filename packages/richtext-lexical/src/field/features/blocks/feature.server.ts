import type { Block, BlockField, Field } from 'payload/types'

import { baseBlockFields, sanitizeFields } from 'payload/config'
import { fieldsToJSONSchema, formatLabels } from 'payload/utilities'

import type { FeatureProviderProviderServer } from '../types.js'
import type { BlocksFeatureClientProps } from './feature.client.js'

import { BlocksFeatureClientComponent } from './feature.client.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { blockPopulationPromiseHOC } from './populationPromise.js'
import { blockValidationHOC } from './validate.js'

export type BlocksFeatureProps = {
  blocks: Block[]
}

export const BlocksFeature: FeatureProviderProviderServer<
  BlocksFeatureProps,
  BlocksFeatureClientProps
> = (props) => {
  // Sanitization taken from payload/src/fields/config/sanitize.ts

  if (props?.blocks?.length) {
    props.blocks = props.blocks.map((block) => {
      return {
        ...block,
        fields: block.fields.concat(baseBlockFields),
        labels: !block.labels ? formatLabels(block.slug) : block.labels,
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
      imageAltText: block.imageAltText,
      imageURL: block.imageURL,
      labels: block.labels,
      subfields: [],
    })
  }

  return {
    feature: () => {
      return {
        ClientComponent: BlocksFeatureClientComponent,
        clientFeatureProps: clientProps,
        generateSchemaMap: ({ config, props }) => {
          const validRelationships = config.collections.map((c) => c.slug) || []

          const schemaMap: {
            [key: string]: Field[]
          } = {}

          for (const block of props.blocks) {
            const unSanitizedFormSchema = block.fields || []

            const formSchema = sanitizeFields({
              config,
              fields: unSanitizedFormSchema,
              validRelationships,
            })

            schemaMap[block.slug] = formSchema
          }

          return schemaMap
        },
        generatedTypes: {
          modifyOutputSchema: ({ currentSchema, field, interfaceNameDefinitions }) => {
            const blocksField: BlockField = {
              name: field?.name + '_lexical_blocks',
              type: 'blocks',
              blocks: props.blocks,
            }
            // This is only done so that interfaceNameDefinitions sets those block's interfaceNames.
            // we don't actually use the JSON Schema itself in the generated types yet.
            fieldsToJSONSchema({}, [blocksField], interfaceNameDefinitions)

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
