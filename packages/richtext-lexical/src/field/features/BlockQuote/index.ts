import { $createQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { MarkdownTransformer } from './markdownTransformer'

export const BlockQuoteFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: BlockquoteIcon,
                isActive: ({ editor, selection }) => false,
                key: 'blockquote',
                label: `Blockquote`,
                onClick: ({ editor }) => {
                  //setHeading(editor, headingSize)
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                      $setBlocksType(selection, () => $createQuoteNode())
                    }
                  })
                },
                order: 20,
              },
            ]),
          ],
        },
        markdownTransformers: [MarkdownTransformer],
        nodes: [QuoteNode],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption(`Blockquote`, {
                  Icon: BlockquoteIcon,
                  keywords: ['quote', 'blockquote'],
                  onSelect: ({ editor }) => {
                    const selection = $getSelection()
                    if ($isRangeSelection(selection)) {
                      $setBlocksType(selection, () => $createQuoteNode())
                    }
                  },
                }),
              ],
              title: 'Basic',
            },
          ],
        },
      }
    },
    key: 'blockquote',
  }
}
