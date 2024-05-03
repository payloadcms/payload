'use client'

import { INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderClient } from '../../types.js'

import { SlashMenuItem } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { UnorderedListIcon } from '../../../lexical/ui/icons/UnorderedList/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../../shared/inlineToolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { UNORDERED_LIST } from './markdownTransformer.js'

const UnorderedListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        markdownTransformers: [UNORDERED_LIST],
        nodes: [ListNode, ListItemNode],
        plugins: [
          {
            Component: LexicalListPlugin,
            position: 'normal',
          },
        ],
        slashMenu: {
          groups: [
            {
              displayName: 'Lists',
              items: [
                {
                  Icon: UnorderedListIcon,
                  displayName: 'Unordered List',
                  key: 'unorderedList',
                  keywords: ['unordered list', 'ul'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                  },
                },
              ],
              key: 'lists',
            },
          ],
        },
        toolbarInline: {
          groups: [
            inlineToolbarTextDropdownGroupWithItems([
              {
                ChildComponent: UnorderedListIcon,
                isActive: () => false,
                key: 'unorderedList',
                label: `Unordered List`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
                },
                order: 11,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const UnorderedListFeatureClientComponent = createClientComponent(UnorderedListFeatureClient)
