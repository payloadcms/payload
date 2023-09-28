import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { RelationshipIcon } from '../../lexical/ui/icons/Relationship'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer'
import './index.scss'
import { RelationshipNode } from './nodes/RelationshipNode'
import RelationshipPlugin from './plugins'

export const RelationshipFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: [RelationshipNode],
        plugins: [
          {
            Component: RelationshipPlugin,
            position: 'normal',
          },
        ],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Relationship', {
                  Icon: RelationshipIcon,
                  keywords: ['relationship', 'relation', 'rel'],
                  onSelect: ({ editor, queryString }) => {
                    // dispatch INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND
                    editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, null)
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
