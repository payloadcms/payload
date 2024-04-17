import type { FeatureProviderProviderServer } from '../types.js'

import { createNode } from '../typeUtilities.js'
import { RelationshipFeatureClientComponent } from './feature.client.js'
import { RelationshipNode } from './nodes/RelationshipNode.js'
import { relationshipPopulationPromise } from './populationPromise.js'

export type RelationshipFeatureProps =
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
            populationPromises: [relationshipPopulationPromise],
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
