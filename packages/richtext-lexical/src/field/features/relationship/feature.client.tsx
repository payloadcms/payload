'use client'

import { withMergedProps } from '@payloadcms/ui/elements/withMergedProps'

import type { FeatureProviderProviderClient } from '../types.js'
import type { RelationshipFeatureProps } from './feature.server.js'

import { RelationshipIcon } from '../../lexical/ui/icons/Relationship/index.js'
import { createClientComponent } from '../createClientComponent.js'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer/commands.js'
import { RelationshipNode } from './nodes/RelationshipNode.js'
import { RelationshipPlugin } from './plugins/index.js'

const RelationshipFeatureClient: FeatureProviderProviderClient<RelationshipFeatureProps> = (
  props,
) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      nodes: [RelationshipNode],
      plugins: [
        {
          Component: withMergedProps({
            Component: RelationshipPlugin,
            toMergeIntoProps: props,
          }),
          position: 'normal',
        },
      ],
      slashMenu: {
        groups: [
          {
            displayName: 'Basic',
            items: [
              {
                Icon: RelationshipIcon,
                displayName: 'Relationship',
                key: 'relationship',
                keywords: ['relationship', 'relation', 'rel'],
                onSelect: ({ editor }) => {
                  // dispatch INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND
                  editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                    replace: false,
                  })
                },
              },
            ],
            key: 'basic',
          },
        ],
      },
    }),
  }
}

export const RelationshipFeatureClientComponent = createClientComponent(RelationshipFeatureClient)
