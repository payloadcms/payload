import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer/commands'
import { RelationshipNode } from './nodes/RelationshipNode'
import { relationshipPopulationPromise } from './populationPromise'

export const RelationshipFeature = (): FeatureProvider => {
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
              import('./plugins').then((module) => module.RelationshipPlugin),
            position: 'normal',
          },
        ],
        props: null,
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption('relationship', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Relationship').then(
                      (module) => module.RelationshipIcon,
                    ),
                  displayName: 'Relationship',
                  keywords: ['relationship', 'relation', 'rel'],
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
