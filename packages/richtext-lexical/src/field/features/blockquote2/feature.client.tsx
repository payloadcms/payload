'use client'

import { $createQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote'
import { TextDropdownSectionWithEntries } from '../common4/floatingSelectToolbarTextDropdownSection'
import { createClientComponent } from '../createClientComponent'
import { MarkdownTransformer } from './markdownTransformer'

const BlockQuoteFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      floatingSelectToolbar: {
        sections: [
          TextDropdownSectionWithEntries([
            {
              ChildComponent: BlockquoteIcon,
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

      nodes: [QuoteNode],
      slashMenu: {
        options: [
          {
            displayName: 'Basic',
            key: 'basic',
            options: [
              new SlashMenuOption(`blockquote`, {
                Icon: BlockquoteIcon,
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
    }),
  }
}

export const BlockQuoteFeatureClientComponent = createClientComponent(BlockQuoteFeatureClient)
