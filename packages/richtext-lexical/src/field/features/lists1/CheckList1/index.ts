import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProvider } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { TextDropdownSectionWithEntries } from '../../common4/floatingSelectToolbarTextDropdownSection'
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
                  // @ts-expect-error-next-line
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
                  type: ListNode.getType(),
                  converters: {
                    html: ListHTMLConverter,
                  },
                  node: ListNode,
                },
                {
                  type: ListItemNode.getType(),
                  converters: {
                    html: ListItemHTMLConverter,
                  },
                  node: ListItemNode,
                },
              ],
        plugins: [
          {
            Component: () =>
              // @ts-expect-error-next-line
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
                    // @ts-expect-error-next-line
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
