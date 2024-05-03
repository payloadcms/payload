'use client'

import { $createQuoteNode, $isQuoteNode, QuoteNode } from '@lexical/rich-text'
import { $setBlocksType } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarGroup } from '../toolbars/types.js'
import type { FeatureProviderProviderClient } from '../types.js'

import { BlockquoteIcon } from '../../lexical/ui/icons/Blockquote/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { toolbarTextDropdownGroupWithItems } from '../shared/toolbar/textDropdownGroup.js'
import { MarkdownTransformer } from './markdownTransformer.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarTextDropdownGroupWithItems([
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
]

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
            items: [
              {
                Icon: BlockquoteIcon,
                key: 'blockquote',
                keywords: ['quote', 'blockquote'],
                label: 'Blockquote',
                onSelect: ({ editor }) => {
                  editor.update(() => {
                    const selection = $getSelection()
                    $setBlocksType(selection, () => $createQuoteNode())
                  })
                },
              },
            ],
            key: 'basic',
            label: 'Basic',
          },
        ],
      },
      toolbarFixed: {
        groups: toolbarGroups,
      },
      toolbarInline: {
        groups: toolbarGroups,
      },
    }),
  }
}

export const BlockQuoteFeatureClientComponent = createClientComponent(BlockQuoteFeatureClient)
