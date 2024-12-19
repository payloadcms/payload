'use client'

import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextColorFeatureProps } from './feature.server.js'

import { $mutateSelectedTextNodes } from '../../lexical/nodes/utils.js'
import { BgColorIcon } from '../../lexical/ui/icons/BgColor/index.js'
import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import './index.scss'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const defaultColors = [
  { classSuffix: 'red', label: 'Red' },
  { classSuffix: 'blue', label: 'Blue' },
  { classSuffix: 'green', label: 'Green' },
  { classSuffix: 'yellow', label: 'Yellow' },
  { classSuffix: 'purple', label: 'Purple' },
  { classSuffix: 'pink', label: 'Pink' },
  { classSuffix: 'orange', label: 'Orange' },
  { classSuffix: 'gray', label: 'Gray' },
]

const toolbarGroups = (props: TextColorFeatureProps): ToolbarGroup[] => {
  // TO-DO: I would rather have defaultBgColors but no defaultColors
  const { bgColors = defaultColors, colors = defaultColors } = props
  const colorItems: ToolbarDropdownGroup['items'] | undefined = colors?.map(({ classSuffix }) => {
    return {
      ChildComponent: TextColorIcon,
      key: `color-${classSuffix}`,
      label: classSuffix,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $mutateSelectedTextNodes(selection, (textNode) => {
            textNode.mutateClasses((classes) => {
              classes['color'] = classSuffix
              delete classes['bgColor'] // TO-DECIDE: this should be like this be default? configurable in props?
            })
          })
        })
      },
      order: 1,
    }
  })
  const bgColorItems: ToolbarDropdownGroup['items'] = bgColors.map(({ classSuffix }) => {
    return {
      ChildComponent: TextColorIcon,
      key: `bg-color-${classSuffix}`,
      label: classSuffix,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $mutateSelectedTextNodes(selection, (textNode) => {
            textNode.mutateClasses((classes) => {
              // TO-DECIDE: prefix should be only bg?
              classes['bg-color'] = classSuffix
              delete classes['color']
            })
          })
        })
      },
      order: 1,
    }
  })

  return [
    {
      type: 'dropdown' as const,
      ChildComponent: TextColorIcon,
      items: colorItems,
      key: 'color',
      order: 30,
    },
    {
      type: 'dropdown' as const,
      ChildComponent: BgColorIcon,
      items: bgColorItems,
      key: 'bg-color',
      order: 30,
    },
  ]
}

export const TextColorFeatureClient = createClientFeature<TextColorFeatureProps>(({ props }) => {
  return {
    toolbarFixed: {
      groups: toolbarGroups(props),
    },
    toolbarInline: {
      groups: toolbarGroups(props),
    },
  }
})
