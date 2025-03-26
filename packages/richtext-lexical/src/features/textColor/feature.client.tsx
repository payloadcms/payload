'use client'

import { $patchStyleText } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextColorSanitizedProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (props: TextColorSanitizedProps): ToolbarGroup[] => {
  const backgroundColorItems: ToolbarDropdownGroup['items'] = props.textColors.map((color) => {
    return {
      ChildComponent: () => <TextColorIcon color={color.light} type="background" />,
      key: `background-${color.name}`,
      label: color.label,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
        })
      },
      order: 1,
    }
  })

  const textColorItems: ToolbarDropdownGroup['items'] = props.textColors.map((color) => {
    return {
      ChildComponent: () => <TextColorIcon color={color.light} type="text" />,
      // Component: () => <h1>Hello color.name: {color.name}</h1>,
      key: `text-${color.name}`,
      label: color.label,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $patchStyleText(selection, { color: color.light })
        })
      },
      order: 2,
    }
  })
  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextColorIcon type="none" />,
      items: [...backgroundColorItems, ...textColorItems],
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
