'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { FeatureProviderProviderClient } from '../../types.js'

import { StrikethroughIcon } from '../../../lexical/ui/icons/Strikethrough/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

const toolbarGroups = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: StrikethroughIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection)) {
          return selection.hasFormat('strikethrough')
        }
        return false
      },
      key: 'strikethrough',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
      },
      order: 4,
    },
  ]),
]

const StrikethroughFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,

        markdownTransformers: [STRIKETHROUGH],
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

export const StrikethroughFeatureClientComponent = createClientComponent(StrikethroughFeatureClient)
