'use client'

import { $createQuoteNode, $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { FeatureProviderProviderClient } from '../types.js'

import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../shared/inlineToolbar/textDropdownGroup.js'
import { MarkdownTransformer } from './markdownTransformer.js'

const BlockQuoteFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      markdownTransformers: [MarkdownTransformer],
      nodes: [QuoteNode],

      slashMenu: {
        groups: [
          {
            displayName: 'Basic',
            items: [
              {
                Icon: BlockquoteIcon,
                displayName: 'Blockquote',
                key: 'blockquote',
                keywords: ['quote', 'blockquote'],
                onSelect: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createQuoteNode())
                  })
                },
              },
            ],
            key: 'basic',
          },
        ],
      },
      toolbarInline: {
        groups: [
          inlineToolbarTextDropdownGroupWithItems([
            {
              ChildComponent: BlockquoteIcon,
              isActive: ({ selection }) => {
                if (!$isRangeSelection(selection)) {
                  return false
                }
                for (const node of selection.getNodes()) {
                  if (!$isQuoteNode(node) && !$isQuoteNode(node.getParent())) {
                    return false
                  }
                }
                return true
              },
              key: 'blockquote',
              label: `Blockquote`,
              onSelect: ({ editor }) => {
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
    }),
  }
}

export const BlockQuoteFeatureClientComponent = createClientComponent(BlockQuoteFeatureClient)
