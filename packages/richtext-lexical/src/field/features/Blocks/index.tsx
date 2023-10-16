import type { Block } from 'payload/types'

import { baseBlockFields } from 'payload/config'
import { formatLabels, getTranslation } from 'payload/utilities'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
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
    props.blocks = props.blocks.map((block) => ({
      ...block,
      fields: block.fields.concat(baseBlockFields),
    }))

    props.blocks = props.blocks.map((block) => {
      const unsanitizedBlock = { ...block }
      unsanitizedBlock.labels = !unsanitizedBlock.labels
        ? formatLabels(unsanitizedBlock.slug)
        : unsanitizedBlock.labels

      // unsanitizedBlock.fields are sanitized in the React component and not here.
      // That's because we do not have access to the payload config here.

      return unsanitizedBlock
    })
  }
  return {
    feature: () => {
      return {
        nodes: [
          {
            afterReadPromises: [blockPopulationPromiseHOC(props)],
            node: BlockNode,
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
              options: [
                /*new SlashMenuOption('Block', {
                  Icon: BlockIcon,
                  keywords: ['block', 'blocks'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_BLOCK_WITH_DRAWER_COMMAND, null)
                  },
                }),*/
                ...props?.blocks?.map((block) => {
                  return new SlashMenuOption(block.slug, {
                    Icon: BlockIcon,
                    displayName: ({ i18n }) => {
                      return getTranslation(block.labels.singular, i18n)
                    },
                    keywords: ['block', 'blocks', block.slug],
                    onSelect: ({ editor }) => {
                      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
                        data: {
                          blockName: '',
                          blockType: block.slug,
                        },
                      })
                    },
                  })
                }),
              ],
              title: 'Blocks',
            },
          ],
        },
      }
    },
    key: 'blocks',
  }
}
