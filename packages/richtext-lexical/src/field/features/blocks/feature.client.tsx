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
            displayName: 'Blocks',
            items: props.reducedBlocks.map((block) => {
              return {
                Icon: BlockIcon,
                displayName: ({ i18n }) => {
                  if (!block.labels.singular) {
                    return block.slug
                  }

                  return getTranslation(block.labels.singular, i18n)
                },
                key: 'block-' + block.slug,
                keywords: ['block', 'blocks', block.slug],
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
          },
        ],
      },
    }),
  }
}

export const BlocksFeatureClientComponent = createClientComponent(BlocksFeatureClient)
