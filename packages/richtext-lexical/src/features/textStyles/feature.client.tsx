'use client'

import { $patchStyleText } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStylesFeatureProps } from './feature.server.js'

import { TextColorIcon } from '../../lexical/ui/icons/TextColor/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (props: TextStylesFeatureProps): ToolbarGroup[] => {
  const clearColor: ToolbarDropdownGroup['items'] = [
    {
      ChildComponent: () => <TextColorIcon />,
      key: `clear-color`,
      label: 'Remove color',
      onSelect: ({ editor }) => {},
      order: 1,
    },
  ]

  const items: ToolbarDropdownGroup['items'] = []

  for (const key in props.styles) {
    const possibleValue = props.styles[key]!
    for (const [item, itemValue] of Object.entries(possibleValue)) {
      const itemValue = possibleValue[item]!
      items.push({
        ChildComponent: () => (
          <TextColorIcon
            color={{ type: 'background', dark: itemValue.css, light: itemValue.css }}
          />
        ),
        key: item,
        label: itemValue.label,
      })
    }
  }

  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextColorIcon />,
      items: [...clearColor, ...items],
      key: 'textStyles',
      order: 30,
    },
  ]
}

export const TextStylesFeatureClient = createClientFeature<TextStylesFeatureProps>(({ props }) => {
  return {
    toolbarFixed: {
      groups: toolbarGroups(props),
    },
    toolbarInline: {
      groups: toolbarGroups(props),
    },
  }
})
