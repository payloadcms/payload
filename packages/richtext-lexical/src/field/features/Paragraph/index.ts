import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
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
        props: null,
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption('paragraph', {
                  Icon: TextIcon,
                  displayName: 'Paragraph',
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
            },
          ],
        },
      }
    },
    key: 'paragraph',
  }
}
