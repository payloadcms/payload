'use client'

import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextClassesFeatureProps } from './feature.server.js'

import { $mutateSelectedTextNodes } from '../../lexical/nodes/index.js'
import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = ({ settings }: TextClassesFeatureProps): ToolbarGroup[] => {
  const attributeSetting = settings[0]
  const items: ToolbarDropdownGroup['items'] = attributeSetting.classSuffixes.map((classSuffix) => {
    return {
      ChildComponent: TextColorIcon,
      key: classSuffix,
      label: classSuffix,
      onSelect: ({ editor }) => {
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return
          }
          $mutateSelectedTextNodes(selection, (textNode) => {
            textNode.mutateClasses((classes) => {
              classes[attributeSetting.classPrefix] = classSuffix
            })
          })
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
      key: 'textClasses',
      order: 30,
    },
  ]
}

export const TextClassesFeatureClient = createClientFeature<TextClassesFeatureProps>(
  ({ props }) => {
    return {
      toolbarFixed: {
        groups: toolbarGroups(props),
      },
      toolbarInline: {
        groups: toolbarGroups(props),
      },
    }
  },
)
