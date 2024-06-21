'use client'

import type { ReducedBlock } from '@payloadcms/ui/utilities/buildComponentMap'

import { getTranslation } from '@payloadcms/translations'

import { BlockIcon } from '../../lexical/ui/icons/Block/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { BlockNode } from './nodes/BlocksNode.js'
import { INSERT_BLOCK_COMMAND } from './plugin/commands.js'
import { BlocksPlugin } from './plugin/index.js'

export type BlocksFeatureClientProps = {
  reducedBlocks: ReducedBlock[]
}

export const BlocksFeatureClient = createClientFeature<BlocksFeatureClientProps>(({ props }) => ({
  nodes: [BlockNode],
  plugins: [
    {
      Component: BlocksPlugin,
      position: 'normal',
    },
  ],
  sanitizedClientFeatureProps: props,
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
        label: ({ i18n }) => {
          return i18n.t('lexical:blocks:label')
        },
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
}))
