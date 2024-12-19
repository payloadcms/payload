'use client'

import { $isTableSelection } from '@lexical/table'
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import { StrikethroughIcon } from '../../../lexical/ui/icons/Strikethrough/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

const toolbarGroups = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: StrikethroughIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
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

export const StrikethroughFeatureClient = createClientFeature({
  enableFormats: ['strikethrough'],
  markdownTransformers: [STRIKETHROUGH],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
