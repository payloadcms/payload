import type { SerializedQuoteNode } from '@lexical/rich-text'

import { $createQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $INTERNAL_isPointSelection, $getSelection } from 'lexical'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { basicSlashMenuGroup } from '../common/basicSlashMenuGroup'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection'
import { convertLexicalNodesToHTML } from '../converters/html/converter'
import { MarkdownTransformer } from './markdownTransformer'
import { translationsClient } from './translations'

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
                label: ({ i18n }) => i18n.t('lexical:blockquote:label'),
                onClick: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    if ($INTERNAL_isPointSelection(selection)) {
                      $setBlocksType(selection, () => $createQuoteNode())
                    }
                  })
                },
                order: 20,
              },
            ]),
          ],
        },
        i18nClient: translationsClient,
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
              ...basicSlashMenuGroup,
              options: [
                new SlashMenuOption(`blockquote`, {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Blockquote').then(
                      (module) => module.BlockquoteIcon,
                    ),
                  keywords: ['quote', 'blockquote'],
                  label: ({ i18n }) => i18n.t('lexical:blockquote:label'),
                  onSelect: () => {
                    const selection = $getSelection()
                    if ($INTERNAL_isPointSelection(selection)) {
                      $setBlocksType(selection, () => $createQuoteNode())
                    }
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
