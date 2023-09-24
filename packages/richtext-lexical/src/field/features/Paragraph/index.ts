import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { TextIcon } from '../../lexical/ui/icons/Text'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'

export const ParagraphFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: TextIcon,
                isActive: ({ editor, selection }) => false,
                key: 'normal-text',
                label: 'Normal Text',
                onClick: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                      $setBlocksType(selection, () => $createParagraphNode())
                    }
                  })
                },
                order: 1,
              },
            ]),
          ],
        },
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Paragraph', {
                  Icon: TextIcon,
                  keywords: ['normal', 'paragraph', 'p', 'text'],
                  onSelect: ({ editor }) => {
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
