'use client'

import { getTranslation } from '@payloadcms/translations'

import type { ReducedBlock } from '../../../../../ui/src/utilities/buildComponentMap/types'
import type { FeatureProviderProviderClient } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { BlockIcon } from '../../lexical/ui/icons/Block'
import { createClientComponent } from '../createClientComponent'
import { BlockNode } from './nodes/BlocksNode'
import { BlocksPlugin } from './plugin'
import { INSERT_BLOCK_COMMAND } from './plugin/commands'

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
        options: [
          {
            displayName: 'Blocks',
            key: 'blocks',
            options: [
              ...props.reducedBlocks.map((block) => {
                return new SlashMenuOption('block-' + block.slug, {
                  Icon: BlockIcon,
                  displayName: ({ i18n }) => {
                    if (!block.labels.singular) {
                      return block.slug
                    }

                    return getTranslation(block.labels.singular, i18n)
                  },
                  keywords: ['block', 'blocks', block.slug],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                      id: null,
                      blockName: '',
                      blockType: block.slug,
                    })
                  },
                })
              }),
            ],
          },
        ],
      },
    }),
  }
}

export const BlocksFeatureClientComponent = createClientComponent(BlocksFeatureClient)
