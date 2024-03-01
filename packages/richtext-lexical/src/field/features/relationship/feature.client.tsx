'use client'

import { withMergedProps } from '@payloadcms/ui'

import type { FeatureProviderProviderClient } from '../types'
import type { RelationshipFeatureProps } from './feature.server'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { RelationshipIcon } from '../../lexical/ui/icons/Relationship'
import { createClientComponent } from '../createClientComponent'
import { INSERT_RELATIONSHIP_WITH_DRAWER_COMMAND } from './drawer/commands'
import { RelationshipNode } from './nodes/RelationshipNode'
import { RelationshipPlugin } from './plugins'

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
