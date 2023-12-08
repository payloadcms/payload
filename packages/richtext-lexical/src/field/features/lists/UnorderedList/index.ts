import { INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { UNORDERED_LIST } from './markdownTransformer'

export const UnorderedListFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/UnorderedList').then(
                    (module) => module.UnorderedListIcon,
                  ),
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
        nodes: [
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
        plugins: [
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
                new SlashMenuOption('unorderedlist', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../../lexical/ui/icons/UnorderedList').then(
                      (module) => module.UnorderedListIcon,
                    ),
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
    key: 'unorderedList',
  }
}
