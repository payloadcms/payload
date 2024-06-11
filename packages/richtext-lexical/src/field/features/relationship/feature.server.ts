import type { RelationshipField } from 'payload/types'

import type { FeatureProviderProviderServer } from '../types.js'

import { createNode } from '../typeUtilities.js'
import { RelationshipFeatureClientComponent } from './feature.client.js'
import { relationshipPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { RelationshipNode } from './nodes/RelationshipNode.js'

export type ExclusiveRelationshipFeatureProps =
  | {
      /**
       * The collections that should be disabled. Overrides the `enableRichTextRelationship` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: string[]

      // Ensures that enabledCollections is not available when disabledCollections is set
      enabledCollections?: never
    }
  | {
      // Ensures that disabledCollections is not available when enabledCollections is set
      disabledCollections?: never

      /**
       * The collections that should be enabled. Overrides the `enableRichTextRelationship` property in the collection config
       * When this property is set, `disabledCollections` will not be available.
       **/
      enabledCollections?: string[]
    }

export type RelationshipFeatureProps = ExclusiveRelationshipFeatureProps & {
  /**
   * Sets a maximum population depth for this relationship, regardless of the remaining depth when the respective field is reached.
   * This behaves exactly like the maxDepth properties of relationship and upload fields.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
}

export const RelationshipFeature: FeatureProviderProviderServer<
  RelationshipFeatureProps,
  RelationshipFeatureProps
> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: RelationshipFeatureClientComponent,
        clientFeatureProps: props,
        i18n,
        nodes: [
          createNode({
            graphQLPopulationPromises: [relationshipPopulationPromiseHOC(props)],
            node: RelationshipNode,
            subFields: ({ node, originalNode, originalNodeWithLocales, req }) => {
              if (node?.value) {
                const collection = req.payload.collections[node?.relationTo]

                if (collection) {
                  // Construct fake relationship field for the relationship itself
                  const relationshipField: RelationshipField = {
                    name: 'relationship',
                    type: 'relationship',
                    localized: false,
                    relationTo: node?.relationTo,
                  }
                  if (props?.maxDepth !== undefined) {
                    relationshipField.maxDepth = props.maxDepth
                  }

                  // For backwards compatibility
                  const valueContainer = {
                    relationship:
                      typeof node?.value === 'object' && node?.value !== null
                        ? // @ts-expect-error
                          node?.value?.id
                        : node?.value,
                  }

                  // makes sure that whatever is later modifying the value will mutate the original node here
                  const valueProxy = new Proxy(valueContainer, {
                    get(target, prop) {
                      if (prop === 'relationship') {
                        return node.value
                      }
                      return {
                        relationship: node.value,
                      }
                    },
                    set(target, prop, newValue) {
                      if (prop === 'relationship') {
                        node.value = newValue
                      } else {
                        node.value = newValue.relationship
                      }
                      return true
                    },
                  })

                  return {
                    data: valueProxy,
                    fields: [relationshipField],
                    originalData: {
                      // @ts-expect-error
                      relationship: originalNode?.value?.id || originalNode?.value, // originalData never needs to be modified
                    },
                    originalDataWithLocales: {
                      relationship:
                        // @ts-expect-error
                        originalNodeWithLocales?.value?.id || originalNodeWithLocales?.value, // originalData never needs to be modified
                    },
                  }
                }
              }
              return null
            },
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'relationship',
    serverFeatureProps: props,
  }
}
