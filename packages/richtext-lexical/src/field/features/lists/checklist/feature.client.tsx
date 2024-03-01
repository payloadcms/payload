'use client'
import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { ClientFeature, FeatureProviderProviderClient } from '../../types'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection'
import { createClientComponent } from '../../createClientComponent'
import { LexicalListPlugin } from '../plugin'
import { CHECK_LIST } from './markdownTransformers'
import { LexicalCheckListPlugin } from './plugin'

const CheckListFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      const plugins: ClientFeature<undefined>['plugins'] = [
        {
          Component: LexicalCheckListPlugin,
          position: 'normal',
        },
      ]

      if (!featureProviderMap.has('unorderedlist') && !featureProviderMap.has('orderedlist')) {
        plugins.push({
          Component: LexicalListPlugin,
          position: 'normal',
        })
      }

      return {
        clientFeatureProps: props,
        floatingSelectToolbar: {
          sections: [
            TextDropdownSectionWithEntries([
              {
                ChildComponent: ChecklistIcon,
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
          featureProviderMap.has('unorderedlist') || featureProviderMap.has('orderedlist')
            ? []
            : [ListNode, ListItemNode],
        plugins,
        slashMenu: {
          options: [
            {
              displayName: 'Lists',
              key: 'lists',
              options: [
                new SlashMenuOption('checklist', {
                  Icon: ChecklistIcon,
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
  }
}

export const CheckListFeatureClientComponent = createClientComponent(CheckListFeatureClient)
