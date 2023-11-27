import type { Block } from 'payload/types'

import { baseBlockFields } from 'payload/config'
import { formatLabels, getTranslation } from 'payload/utilities'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { BlockIcon } from '../../lexical/ui/icons/Block'
import './index.scss'
import { BlockNode } from './nodes/BlocksNode'
import { BlocksPlugin, INSERT_BLOCK_COMMAND } from './plugin'
import { blockPopulationPromiseHOC } from './populationPromise'
import { blockValidationHOC } from './validate'

export type BlocksFeatureProps = {
  blocks: Block[]
}

export const BlocksFeature = (props?: BlocksFeatureProps): FeatureProvider => {
  // Sanitization taken from payload/src/fields/config/sanitize.ts
  if (props?.blocks?.length) {
    props.blocks = props.blocks.map((block) => {
      return {
        ...block,
        fields: block.fields.concat(baseBlockFields),
        labels: !block.labels ? formatLabels(block.slug) : block.labels,
      }
    })
    //  unsanitizedBlock.fields are sanitized in the React component and not here.
    // That's because we do not have access to the payload config here.
  }
  return {
    feature: () => {
      return {
        nodes: [
          {
            node: BlockNode,
            populationPromises: [blockPopulationPromiseHOC(props)],
            type: BlockNode.getType(),
            validations: [blockValidationHOC(props)],
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
              displayName: 'Blocks',
              key: 'blocks',
              options: [
                ...props.blocks.map((block) => {
                  return new SlashMenuOption('block-' + block.slug, {
                    Icon: BlockIcon,
                    displayName: ({ i18n }) => {
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
      }
    },
    key: 'blocks',
  }
}
