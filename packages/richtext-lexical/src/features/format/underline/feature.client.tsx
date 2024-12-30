'use client'

import { $isTableSelection } from '@lexical/table'
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { UnderlineIcon } from '../../../lexical/ui/icons/Underline/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: UnderlineIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
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

export const UnderlineFeatureClient = createClientFeature({
  enableFormats: ['underline'],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
