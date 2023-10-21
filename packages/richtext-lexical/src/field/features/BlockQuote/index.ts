import type { SerializedHeadingNode, SerializedQuoteNode } from '@lexical/rich-text'

import { $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { MarkdownTransformer } from './markdownTransformer'

export const BlockQuoteFeature = (): FeatureProvider => {
  return {
    feature: () => {
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
        nodes: [
          {
            converters: {
              html: {
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                  })

                  return `<blockquote>${childrenText}</blockquote>`
                },
                nodeTypes: [QuoteNode.getType()],
              } as HTMLConverter<SerializedQuoteNode>,
            },
            node: QuoteNode,
            type: QuoteNode.getType(),
          },
        ],
        props: null,
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
