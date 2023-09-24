import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { BlockIcon } from '../../lexical/ui/icons/Block'

export const ParagraphFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Paragraph', {
                  Icon: BlockIcon,
                  keywords: ['normal', 'paragraph', 'p', 'text'],
                  onSelect: (editor) => {
                    editor.update(() => {
                      const selection = $getSelection()
                      if ($isRangeSelection(selection)) {
                        $setBlocksType(selection, () => $createParagraphNode())
                      }
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
    key: 'paragraph',
  }
}
