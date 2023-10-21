import { INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { OrderedListIcon } from '../../../lexical/ui/icons/OrderedList'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { LexicalListPlugin } from '../plugin'
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
                converters: {
                  html: ListHTMLConverter,
                },
                node: ListNode,
                type: ListNode.getType(),
              },
              {
                converters: {
                  html: ListItemHTMLConverter,
                },
                node: ListItemNode,
                type: ListItemNode.getType(),
              },
            ],
        plugins: featureProviderMap.has('unorderedList')
          ? []
          : [
              {
                Component: LexicalListPlugin,
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
