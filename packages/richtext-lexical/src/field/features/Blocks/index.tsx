import type { Block } from 'payload/types'

import { baseBlockFields } from 'payload/config'
import { formatLabels } from 'payload/utilities'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { BlockIcon } from '../../lexical/ui/icons/Block'
import { INSERT_BLOCK_WITH_DRAWER_COMMAND } from './drawer'
import './index.scss'
import { BlockNode } from './nodes/BlocksNode'
import { BlocksPlugin } from './plugin'

export type BlocksFeatureProps = {
  blocks: Block[]
}

export const BlocksFeature = (props?: BlocksFeatureProps): FeatureProvider => {
  // Sanitization taken from payload/src/fields/config/sanitize.ts
  if (props?.blocks?.length) {
    props.blocks = props.blocks.map((block) => ({
      ...block,
      fields: block.fields.concat(baseBlockFields),
    }))

    props.blocks = props.blocks.map((block) => {
      const unsanitizedBlock = { ...block }
      unsanitizedBlock.labels = !unsanitizedBlock.labels
        ? formatLabels(unsanitizedBlock.slug)
        : unsanitizedBlock.labels

      // TODO
      /*unsanitizedBlock.fields = sanitizeFields({
        config,
        fields: block.fields,
        validRelationships,
      })*/

      return unsanitizedBlock
    })
  }
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: [
          {
            node: BlockNode,
            type: BlockNode.getType(),
          },
        ],
        plugins: [
          {
            Component: BlocksPlugin,
            position: 'normal',
          },
        ],
        props: props,
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Block', {
                  Icon: BlockIcon,
                  keywords: ['block', 'blocks'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_BLOCK_WITH_DRAWER_COMMAND, null)
                  },
                }),
              ],
              title: 'Basic',
            },
          ],
        },
      }
    },
    key: 'blocks',
  }
}
