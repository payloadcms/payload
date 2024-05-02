'use client'
import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { ClientFeature, FeatureProviderProviderClient } from '../../types.js'

import { SlashMenuItem } from '../../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types.js'
import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../../shared/inlineToolbar/textDropdownGroup.js'
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
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedlist') || featureProviderMap.has('orderedlist')
            ? []
            : [ListNode, ListItemNode],
        plugins,
        slashMenu: {
          groups: [
            {
              displayName: 'Lists',
              items: [
                {
                  Icon: ChecklistIcon,
                  displayName: 'Check List',
                  key: 'checklist',
                  keywords: ['check list', 'check', 'checklist', 'cl'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
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
                ChildComponent: ChecklistIcon,
                isActive: () => false,
                key: 'checkList',
                label: `Check List`,
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
                },
                order: 12,
              },
            ]),
          ],
        },
      }
    },
  }
}

export const CheckListFeatureClientComponent = createClientComponent(CheckListFeatureClient)
