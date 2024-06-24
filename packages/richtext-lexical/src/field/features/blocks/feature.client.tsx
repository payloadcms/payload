'use client'

import type { ReducedBlock } from '@payloadcms/ui/utilities/buildComponentMap'

import { getTranslation } from '@payloadcms/translations'

import type { FeatureProviderProviderClient } from '../types.js'

import { BlockIcon } from '../../lexical/ui/icons/Block/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { INSERT_BLOCK_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'

export type BlocksFeatureClientProps = {
  reducedBlocks: ReducedBlock[]
}

const BlocksFeatureClient: FeatureProviderProviderClient<BlocksFeatureClientProps> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      nodes: [BlockNode],
      plugins: [
        {
          Component: BlocksPlugin,
          position: 'normal',
        },
      ],
      slashMenu: {
        groups: [
          {
            items: props.reducedBlocks.map((block) => {
              return {
                Icon: BlockIcon,
                key: 'block-' + block.slug,
                keywords: ['block', 'blocks', block.slug],
                label: ({ i18n }) => {
                  if (!block.labels.singular) {
                    return block.slug
                  }

                  return getTranslation(block.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                    id: null,
                    blockName: '',
                    blockType: block.slug,
                  })
                },
              }
            }),
            key: 'blocks',
            label: 'Blocks',
          },
        ],
      },
      toolbarFixed: {
        groups: [
          {
            type: 'dropdown',
            ChildComponent: BlockIcon,
            items: props.reducedBlocks.map((block, index) => {
              return {
                ChildComponent: BlockIcon,
                isActive: undefined, // At this point, we would be inside a sub-richtext-editor. And at this point this will be run against the focused sub-editor, not the parent editor which has the actual block. Thus, no point in running this
                key: 'block-' + block.slug,
                label: ({ i18n }) => {
                  if (!block.labels.singular) {
                    return block.slug
                  }

                  return getTranslation(block.labels.singular, i18n)
                },
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                    id: null,
                    blockName: '',
                    blockType: block.slug,
                  })
                },
                order: index,
              }
            }),
            key: 'blocks',
            order: 20,
          },
        ],
      },
    }),
  }
}

export const BlocksFeatureClientComponent = createClientComponent(BlocksFeatureClient)
