'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { FeatureProviderProviderClient } from '../../types.js'

import { UnderlineIcon } from '../../../lexical/ui/icons/Underline/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: UnderlineIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection)) {
          return selection.hasFormat('underline')
        }
        return false
      },
      key: 'underline',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
      },
      order: 3,
    },
  ]),
]

const UnderlineFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,
        toolbarFixed: {
          groups: toolbarGroups,
        },
        toolbarInline: {
          groups: toolbarGroups,
        },
      }
    },
  }
}

export const UnderlineFeatureClientComponent = createClientComponent(UnderlineFeatureClient)
