import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist'
import { CHECK_LIST } from './markdownTransformers'

// 345
// carbs 7
export const CheckListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap, resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
            ? []
            : [
                {
                  node: ListNode,
                  type: ListNode.getType(),
                },
                {
                  node: ListItemNode,
                  type: ListItemNode.getType(),
                },
              ],
        plugins: [
          {
            Component: CheckListPlugin,
            position: 'normal',
          },
        ],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Check List', {
                  Icon: ChecklistIcon,
                  keywords: ['check list', 'check', 'checklist', 'cl'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
                  },
                }),
              ],
              title: 'Lists',
            },
          ],
        },
      }
    },
    key: 'checkList',
  }
}
