'use client'

import { $patchStyleText } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextColorFeatureProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (colors: TextColorFeatureProps['colors']): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = colors.map((color) => {
    return {
      ChildComponent: TextColorIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          // return selection.hasFormat('bold') // TO-DO: fix this
        }
        return false
      },
      key: color.label,
      label: color.label,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $patchStyleText(selection, { color: color.value })
        })
      },
      order: 1,
    }
  })
  return [
    {
      type: 'dropdown',
      ChildComponent: TextColorIcon,
      items,
      key: 'textColor',
      order: 30,
    },
  ]
}

export const TextColorFeatureClient = createClientFeature<TextColorFeatureProps>(({ props }) => {
  console.log('props', props)
  const { colors } = props
  return {
    toolbarFixed: {
      groups: toolbarGroups(colors),
    },
    toolbarInline: {
      groups: toolbarGroups(colors),
    },
  }
})
