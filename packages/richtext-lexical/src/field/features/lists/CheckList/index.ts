import type { LexicalNode, ParagraphNode } from 'lexical'

import { $createListNode, ListItemNode, ListNode } from '@lexical/list'
import { $setBlocksType } from '@lexical/selection'
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  DEPRECATED_$isGridSelection,
} from 'lexical'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist'

export const CheckListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap, resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
            ? []
            : [ListItemNode, ListNode],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('CheckList', {
                  Icon: ChecklistIcon,
                  keywords: ['check list', 'check', 'checklist', 'cl'],
                  onSelect: ({ editor }) => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
                      const node: LexicalNode = selection.anchor.getNode()
                      const isEmptyParagraph =
                        node.getType() === 'paragraph' && node.getTextContent() === ''
                      if (isEmptyParagraph) {
                        ;(node as ParagraphNode).replace(
                          $createListNode('check').append($createTextNode('')),
                        )
                      } else {
                        $setBlocksType(selection, () => $createListNode('check'))
                      }
                    }
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
