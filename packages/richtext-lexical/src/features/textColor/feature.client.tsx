'use client'

import { $patchStyleText } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextColorSanitizedProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (props: TextColorSanitizedProps): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = props.textColors.map((color) => {
    return {
      ChildComponent: TextColorIcon,
      // Component: () => <h1>Hello color.name: {color.name}</h1>,
      key: color.name,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $patchStyleText(selection, { color: color.light })
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

export const TextColorFeatureClient = createClientFeature<TextColorSanitizedProps>(({ props }) => {
  return {
    toolbarFixed: {
      groups: toolbarGroups(props),
    },
    toolbarInline: {
      groups: toolbarGroups(props),
    },
  }
})
