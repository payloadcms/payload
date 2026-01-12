'use client'

import { $isTableSelection } from '@lexical/table'
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical'

import type { ToolbarGroup } from '../../toolbars/types.js'

import { CodeIcon } from '../../../lexical/ui/icons/Code/index.js'
import { createClientFeature } from '../../../utilities/createClientFeature.js'
import { toolbarFormatGroupWithItems } from '../shared/toolbarFormatGroup.js'
import { INLINE_CODE } from './markdownTransformers.js'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: CodeIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat('code')
        }
        return false
      },
      key: 'inlineCode',
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')
      },
      order: 7,
    },
  ]),
]

export const InlineCodeFeatureClient = createClientFeature({
  enableFormats: ['code'],
  markdownTransformers: [INLINE_CODE],
  toolbarFixed: {
    groups: toolbarGroups,
  },
  toolbarInline: {
    groups: toolbarGroups,
  },
})
