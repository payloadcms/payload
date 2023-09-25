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
import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList'

export const UnoderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: [ListItemNode, ListNode],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Unordered List', {
                  Icon: UnorderedListIcon,
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection) || DEPRECATED_$isGridSelection(selection)) {
                      const node: LexicalNode = selection.anchor.getNode()
                      const isEmptyParagraph =
                        node.getType() === 'paragraph' && node.getTextContent() === ''
                      if (isEmptyParagraph) {
                        ;(node as ParagraphNode).replace(
                          $createListNode('bullet').append($createTextNode('')),
                        )
                      } else {
                        $setBlocksType(selection, () => $createListNode('bullet'))
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
    key: 'unorderedList',
  }
}
