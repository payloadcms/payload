'use client'

import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'
import type { FeatureProviderProviderClient } from '../../types.js'

import { ItalicIcon } from '../../../lexical/ui/icons/Italic/index.js'
import { createClientComponent } from '../../createClientComponent.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: ItalicIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection)) {
          return selection.hasFormat('italic')
        }
        return false
      },
      key: 'italic',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')
      },
      order: 2,
    },
  ]),
]

const ItalicFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => {
      return {
        clientFeatureProps: props,

        markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
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

export const ItalicFeatureClientComponent = createClientComponent(ItalicFeatureClient)
