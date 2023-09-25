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
import { OrderedListIcon } from '../../../lexical/ui/icons/OrderedList'

export const OrderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap, resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: featureProviderMap.has('unorderedList') ? [] : [ListItemNode, ListNode],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Ordered List', {
                  Icon: OrderedListIcon,
                  keywords: ['ordered list', 'ol'],
                  onSelect: ({ editor }) => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
                      const node: LexicalNode = selection.anchor.getNode()
                      const isEmptyParagraph =
                        node.getType() === 'paragraph' && node.getTextContent() === ''
                      if (isEmptyParagraph) {
                        ;(node as ParagraphNode).replace(
                          $createListNode('number').append($createTextNode('')),
                        )
                      } else {
                        $setBlocksType(selection, () => $createListNode('number'))
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
    key: 'orderedList',
  }
}
