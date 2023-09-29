import { INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { OrderedListIcon } from '../../../lexical/ui/icons/OrderedList'
import { ORDERED_LIST } from './markdownTransformer'

export const OrderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap, resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        markdownTransformers: [ORDERED_LIST],
        nodes: featureProviderMap.has('unorderedList')
          ? []
          : [
              {
                node: ListNode,
                type: ListNode.getType(),
              },
              { node: ListItemNode, type: ListItemNode.getType() },
            ],
        plugins: featureProviderMap.has('unorderedList')
          ? []
          : [
              {
                Component: ListPlugin,
                position: 'normal',
              },
            ],
        props: null,
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Ordered List', {
                  Icon: OrderedListIcon,
                  keywords: ['ordered list', 'ol'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
              title: 'Lists',
            },
          ],
        },
      }
    },
    key: 'orderedList',
  }
}
