'use client'

import { $isTableSelection } from '@lexical/table'
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { SuperscriptIcon } from '../../../lexical/ui/icons/Superscript/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: SuperscriptIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat('superscript')
        }
        return false
      },
      key: 'superscript',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
      },
      order: 6,
    },
  ]),
]

export const SuperscriptFeatureClient = createClientFeature({
  enableFormats: ['superscript'],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
