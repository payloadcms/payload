import { INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList'

export const UnoderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: [ListItemNode, ListNode],
        plugins: [
          {
            Component: ListPlugin,
            position: 'normal',
          },
        ],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Unordered List', {
                  Icon: UnorderedListIcon,
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
              title: 'Lists',
            },
          ],
        },
      }
    },
    key: 'unorderedList',
  }
}
