'use client'

import { INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderClient } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { createClientComponent } from '../../createClientComponent'
import { LexicalListPlugin } from '../plugin'
import { UNORDERED_LIST } from './markdownTransformer'

const UnorderedListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: UnorderedListIcon,
                isActive: () => false,
                key: 'unorderedList',
                label: `Unordered List`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                },
                order: 11,
              },
            ]),
          ],
        },
        markdownTransformers: [UNORDERED_LIST],
        nodes: [ListNode, ListItemNode],
        plugins: [
          {
            Component: LexicalListPlugin,
            position: 'normal',
          },
        ],
        slashMenu: {
          options: [
            {
              displayName: 'Lists',
              key: 'lists',
              options: [
                new SlashMenuOption('unorderedlist', {
                  Icon: UnorderedListIcon,
                  displayName: 'Unordered List',
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
            },
          ],
        },
      }
    },
  }
}

export const UnorderedListFeatureClientComponent = createClientComponent(UnorderedListFeatureClient)
