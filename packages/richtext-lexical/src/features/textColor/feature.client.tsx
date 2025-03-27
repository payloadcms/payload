'use client'

import { $patchStyleText } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextColorSanitizedProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (props: TextColorSanitizedProps): ToolbarGroup[] => {
  const clearColor: ToolbarDropdownGroup['items'] = [
    {
      ChildComponent: () => <TextColorIcon />,
      key: `clear-color`,
      label: 'Remove color',
      onSelect: ({ editor }) => {},
      order: 1,
    },
  ]

  const backgroundColorItems: ToolbarDropdownGroup['items'] = props.textColors.map((color) => {
    return {
      ChildComponent: () => (
        <TextColorIcon color={{ type: 'background', dark: color.dark, light: color.light }} />
      ),
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
      order: 2,
    }
  })

  const textColorItems: ToolbarDropdownGroup['items'] = props.textColors.map((color) => {
    return {
      ChildComponent: () => (
        <TextColorIcon color={{ type: 'text', dark: color.dark, light: color.light }} />
      ),
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
      order: 3,
    }
  })
  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextColorIcon />,
      items: [...clearColor, ...backgroundColorItems, ...textColorItems],
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
