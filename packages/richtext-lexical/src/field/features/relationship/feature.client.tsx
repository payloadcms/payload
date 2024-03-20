'use client'

import { withMergedProps } from '@payloadcms/ui/elements/withMergedProps'

import type { FeatureProviderProviderClient } from '../types.js'
import type { RelationshipFeatureProps } from './feature.server.js'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
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
        options: [
          {
            displayName: 'Basic',
            key: 'basic',
            options: [
              new SlashMenuOption('relationship', {
                Icon: RelationshipIcon,
                displayName: 'Relationship',
                keywords: ['relationship', 'relation', 'rel'],
                onSelect: ({ editor }) => {
                  // dispatch INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND
                  editor.dispatchCommand(INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND, {
                    replace: false,
                  })
                },
              }),
            ],
          },
        ],
      },
    }),
  }
}

export const RelationshipFeatureClientComponent = createClientComponent(RelationshipFeatureClient)
