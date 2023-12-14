import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer/commands'
import { RelationshipNode } from './nodes/RelationshipNode'
import { relationshipPopulationPromise } from './populationPromise'

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

export const RelationshipFeature = (props?: RelationshipFeatureProps): FeatureProvider => {
  return {
    feature: () => {
      return {
        nodes: [
          {
            node: RelationshipNode,
            populationPromises: [relationshipPopulationPromise],
            type: RelationshipNode.getType(),
            // TODO: Add validation similar to upload
          },
        ],
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugins').then((module) => {
                const RelationshipPlugin = module.RelationshipPlugin
                return import('payload/utilities').then((module2) =>
                  module2.withMergedProps({
                    Component: RelationshipPlugin,
                    toMergeIntoProps: props,
                  }),
                )
              }),
            position: 'normal',
          },
        ],
        props: props,
        slashMenu: {
          options: [
            {
              key: 'basic',
              label: 'Basic',
              options: [
                new SlashMenuOption('relationship', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Relationship').then(
                      (module) => module.RelationshipIcon,
                    ),
                  keywords: ['relationship', 'relation', 'rel'],
                  label: 'Relationship',
                  onSelect: ({ editor }) => {
                    // dispatch INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND
                    editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                      replace: false,
                    })
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'relationship',
  }
}
