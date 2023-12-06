import { INSERT_ORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { ORDERED_LIST } from './markdownTransformer'

export const OrderedListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/OrderedList').then(
                    (module) => module.OrderedListIcon,
                  ),
                isActive: () => false,
                key: 'orderedList',
                label: `Ordered List`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                },
                order: 10,
              },
            ]),
          ],
        },
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
                Component: () =>
                  // @ts-expect-error
                  import('../plugin').then((module) => module.LexicalListPlugin),
                position: 'normal',
              },
            ],
        props: null,
        slashMenu: {
          options: [
            {
              displayName: 'Lists',
              key: 'lists',
              options: [
                new SlashMenuOption('orderedlist', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../../lexical/ui/icons/OrderedList').then(
                      (module) => module.OrderedListIcon,
                    ),
                  displayName: 'Ordered List',
                  keywords: ['ordered list', 'ol'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'orderedList',
  }
}
