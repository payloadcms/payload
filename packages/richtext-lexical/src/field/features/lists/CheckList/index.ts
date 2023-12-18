import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { CHECK_LIST } from './markdownTransformers'

// 345
// carbs 7
export const CheckListFeature = (): FeatureProvider => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import('../../../lexical/ui/icons/Checklist').then(
                    (module) => module.ChecklistIcon,
                  ),
                isActive: () => false,
                key: 'checkList',
                label: `Check List`,
                onClick: ({ editor }) => {
                  editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
                },
                order: 12,
              },
            ]),
          ],
        },
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
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
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.LexicalCheckListPlugin),
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
                new SlashMenuOption('checklist', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../../lexical/ui/icons/Checklist').then(
                      (module) => module.ChecklistIcon,
                    ),
                  displayName: 'Check List',
                  keywords: ['check list', 'check', 'checklist', 'cl'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
                  },
                }),
              ],
            },
          ],
        },
      }
    },
    key: 'checkList',
  }
}
