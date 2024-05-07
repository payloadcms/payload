import type { FeatureProviderProviderServer } from '../types.js'

import { createNode } from '../typeUtilities.js'
import { RelationshipFeatureClientComponent } from './feature.client.js'
import { RelationshipNode } from './nodes/RelationshipNode.js'
import { relationshipPopulationPromiseHOC } from './populationPromise.js'

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
        nodes: [
          createNode({
            node: RelationshipNode,
            populationPromises: [relationshipPopulationPromiseHOC(props)],
            // TODO: Add validation similar to upload
          }),
        ],
        serverFeatureProps: props,
      }
    },
    key: 'relationship',
    serverFeatureProps: props,
  }
}
