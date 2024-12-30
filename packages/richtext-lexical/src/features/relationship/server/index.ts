import type { CollectionSlug } from 'payload'

import { populate } from '../../../populateGraphQL/populate.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { relationshipPopulationPromiseHOC } from './graphQLPopulationPromise.js'
import { i18n } from './i18n.js'
import { RelationshipServerNode } from './nodes/RelationshipNode.js'

export type ExclusiveRelationshipFeatureProps =
  | {
      /**
       * The collections that should be disabled. Overrides the `enableRichTextRelationship` property in the collection config.
       * When this property is set, `enabledCollections` will not be available.
       **/
      disabledCollections?: CollectionSlug[]

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
      enabledCollections?: CollectionSlug[]
    }

export type RelationshipFeatureProps = {
  /**
   * Sets a maximum population depth for this relationship, regardless of the remaining depth when the respective field is reached.
   * This behaves exactly like the maxDepth properties of relationship and upload fields.
   *
   * {@link https://payloadcms.com/docs/getting-started/concepts#field-level-max-depth}
   */
  maxDepth?: number
} & ExclusiveRelationshipFeatureProps

export const RelationshipFeature = createServerFeature<
  RelationshipFeatureProps,
  RelationshipFeatureProps,
  ExclusiveRelationshipFeatureProps
>({
  feature: ({ props }) => {
    // we don't need to pass maxDepth to the client, it's only used on the server
    const { maxDepth, ...clientFeatureProps } = props ?? {}
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#RelationshipFeatureClient',
      clientFeatureProps,
      i18n,
      nodes: [
        createNode({
          graphQLPopulationPromises: [relationshipPopulationPromiseHOC(props)],
          hooks: {
            afterRead: [
              ({
                currentDepth,
                depth,
                draft,
                node,
                overrideAccess,
                populateArg,
                populationPromises,
                req,
                showHiddenFields,
              }) => {
                if (!node?.value) {
                  return node
                }
                const collection = req.payload.collections[node?.relationTo]

                if (!collection) {
                  return node
                }
                // @ts-expect-error
                const id = node?.value?.id || node?.value // for backwards-compatibility

                const populateDepth = maxDepth !== undefined && maxDepth < depth ? maxDepth : depth

                populationPromises.push(
                  populate({
                    id,
                    collectionSlug: collection.config.slug,
                    currentDepth,
                    data: node,
                    depth: populateDepth,
                    draft,
                    key: 'value',
                    overrideAccess,
                    req,
                    select:
                      populateArg?.[collection.config.slug] ?? collection.config.defaultPopulate,
                    showHiddenFields,
                  }),
                )

                return node
              },
            ],
          },
          node: RelationshipServerNode,
        }),
      ],
    }
  },
  key: 'relationship',
})
