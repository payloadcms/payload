'use client'

import type { FeatureProviderProviderClient } from '@payloadcms/richtext-lexical'

import { createClientComponent } from '@payloadcms/richtext-lexical/components'
import { $isNodeSelection } from 'lexical'

import { Icon } from './Icon'
import { $isLargeBodyNode, INSERT_LARGE_BODY_COMMAND, LargeBodyNode } from './nodes/LargeBodyNode'
import { LargeBodyPlugin } from './plugin/index'

const LargeBodyFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      nodes: [LargeBodyNode],
      plugins: [
        {
          Component: LargeBodyPlugin,
          position: 'normal',
        },
      ],
      slashMenu: {
        groups: [
          {
            items: [
              {
                Icon,
                key: 'largeBody',
                keywords: ['p', 'large body'],
                label: `Large Body`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_LARGE_BODY_COMMAND, undefined)
                },
              },
            ],
            key: 'extra',
            label: 'Extra',
          },
        ],
      },
      toolbarFixed: {
        groups: [
          {
            type: 'buttons',
            items: [
              {
                ChildComponent: Icon,
                isActive: ({ selection }) => {
                  if (!$isNodeSelection(selection) || !selection.getNodes().length) {
                    return false
                  }

                  const firstNode = selection.getNodes()[0]
                  return $isLargeBodyNode(firstNode)
                },
                key: 'largeBody',
                label: `Large Body`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_LARGE_BODY_COMMAND, undefined)
                },
              },
            ],
            key: 'largeBody',
            order: 50,
          },
        ],
      },
    }),
  }
}

export const LargeBodyFeatureClientComponent = createClientComponent(LargeBodyFeatureClient)
