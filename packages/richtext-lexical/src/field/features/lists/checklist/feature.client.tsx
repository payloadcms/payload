'use client'
import { INSERT_CHECK_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list'

import type { ClientFeature, FeatureProviderProviderClient } from '../../types.js'

import { ChecklistIcon } from '../../../lexical/ui/icons/Checklist/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { inlineToolbarTextDropdownGroupWithItems } from '../../shared/inlineToolbar/textDropdownGroup.js'
import { LexicalListPlugin } from '../plugin/index.js'
import { CHECK_LIST } from './markdownTransformers.js'
import { LexicalCheckListPlugin } from './plugin/index.js'

const ChecklistFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: ({ featureProviderMap }) => {
      const plugins: ClientFeature<undefined>['plugins'] = [
        {
          Component: LexicalCheckListPlugin,
          position: 'normal',
        },
      ]

      if (!featureProviderMap.has('unorderedList') && !featureProviderMap.has('orderedList')) {
        plugins.push({
          Component: LexicalListPlugin,
          position: 'normal',
        })
      }

      return {
        clientFeatureProps: props,
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
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
                key: 'checklist',
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

export const ChecklistFeatureClientComponent = createClientComponent(ChecklistFeatureClient)
