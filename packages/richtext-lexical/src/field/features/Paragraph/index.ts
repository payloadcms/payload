import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'

export const ParagraphFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/Text').then((module) => module.TextIcon),
                isActive: () => false,
                key: 'normal-text',
                label: 'Normal Text',
                onClick: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createParagraphNode())
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
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Text').then((module) => module.TextIcon),
                  displayName: 'Paragraph',
                  keywords: ['normal', 'paragraph', 'p', 'text'],
                  onSelect: ({ editor }) => {
                    editor.update(() => {
                      const selection = $getSelection()
                      $setBlocksType(selection, () => $createParagraphNode())
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
