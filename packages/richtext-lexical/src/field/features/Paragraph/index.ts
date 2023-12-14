import { $setBlocksType } from '@lexical/selection'
import { $INTERNAL_isPointSelection, $createParagraphNode, $getSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { basicSlashMenuGroup } from '../common/basicSlashMenuGroup'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { translationsClient } from './translations'

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
                label: ({ i18n }) => i18n.t('lexical:paragraph:labelSelectToolbar'),
                onClick: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($INTERNAL_isPointSelection(selection)) {
                      $setBlocksType(selection, () => $createParagraphNode())
                    }
                  })
                },
                order: 1,
              },
            ]),
          ],
        },
        i18nClient: translationsClient,
        props: null,
        slashMenu: {
          options: [
            {
              ...basicSlashMenuGroup,
              options: [
                new SlashMenuOption('paragraph', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Text').then((module) => module.TextIcon),
                  keywords: ['normal', 'paragraph', 'p', 'text'],
                  label: ({ i18n }) => i18n.t('lexical:paragraph:labelSlashMenu'),
                  onSelect: ({ editor }) => {
                    editor.update(() => {
                      const selection = $getSelection()
                      if ($INTERNAL_isPointSelection(selection)) {
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
