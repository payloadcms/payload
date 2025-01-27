import type { SerializedQuoteNode } from '@lexical/rich-text'

import { $createQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection } from 'lexical'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
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
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../lexical/ui/icons/Blockquote').then(
                    (module) => module.BlockquoteIcon,
                  ),
                isActive: () => false,
                key: 'blockquote',
                label: `Blockquote`,
                onClick: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createQuoteNode())
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
            type: QuoteNode.getType(),
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
          },
        ],
        props: null,
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption(`blockquote`, {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Blockquote').then(
                      (module) => module.BlockquoteIcon,
                    ),
                  displayName: `Blockquote`,
                  keywords: ['quote', 'blockquote'],
                  onSelect: () => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createQuoteNode())
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'blockquote',
  }
}
