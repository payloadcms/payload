'use client'

import { $isInlineBlockNode, createClientFeature } from '@payloadcms/richtext-lexical/client'
import { $getSelection } from '@payloadcms/richtext-lexical/lexical'
import { CloseMenuIcon } from '@payloadcms/ui'

import { ModifyInlineBlockPlugin } from './plugin.js'

export const ModifyInlineBlockFeatureClient = createClientFeature({
  plugins: [
    {
      Component: ModifyInlineBlockPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: [
      {
        key: 'debug',
        items: [
          {
            ChildComponent: CloseMenuIcon,
            key: 'setKeyToDebug',
            label: 'Set Key To Debug',
            onSelect({ editor }) {
              editor.update(() => {
                const selection = $getSelection()

                // Check if selection consist of 1 node and that its an inlineblocknode
                const nodes = selection.getNodes()

                if (nodes.length !== 1) {
                  return
                }

                const node = nodes[0]

                if (!$isInlineBlockNode(node)) {
                  return
                }

                const fields = node.getFields()

                node.setFields({
                  blockType: fields.blockType,
                  id: fields.id,
                  key: 'value2',
                })
              })
            },
          },
        ],
        type: 'buttons',
      },
    ],
  },
})
