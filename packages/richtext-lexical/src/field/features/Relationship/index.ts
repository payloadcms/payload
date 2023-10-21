import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { RelationshipIcon } from '../../lexical/ui/icons/Relationship'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer'
import './index.scss'
import { RelationshipNode } from './nodes/RelationshipNode'
import RelationshipPlugin from './plugins'
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
            Component: RelationshipPlugin,
            position: 'normal',
          },
        ],
        props: null,
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Relationship', {
                  Icon: RelationshipIcon,
                  keywords: ['relationship', 'relation', 'rel'],
                  onSelect: ({ editor }) => {
                    // dispatch INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND
                    editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                      replace: false,
                    })
                  },
                }),
              ],
              title: 'Basic',
            },
          ],
        },
      }
    },
    key: 'relationship',
  }
}
