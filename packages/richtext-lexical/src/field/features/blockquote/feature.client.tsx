'use client'

import lexicalRichTextImport from '@lexical/rich-text'
const { $createQuoteNode, QuoteNode } = lexicalRichTextImport

import lexicalSelectionImport from '@lexical/selection'
const { $setBlocksType } = lexicalSelectionImport

import lexicalImport from 'lexical'
const { $getSelection } = lexicalImport

import type { FeatureProviderProviderClient } from '../types.js'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote/index.js'
import { TextDropdownSectionWithEntries } from '../common/floatingSelectToolbarTextDropdownSection/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { MarkdownTransformer } from './markdownTransformer.js'

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
