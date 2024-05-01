'use client'
import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { ClientFeature, FeatureProviderProviderClient } from '../../types.js'

import { SlashMenuOption } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist/index.js'
import { TextDropdownSectionWithEntries } from '../../common/floatingSelectToolbarTextDropdownSection/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { CHECK_LIST } from './markdownTransformers.js'
import { LexicalCheckListPlugin } from './plugin/index.js'

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
