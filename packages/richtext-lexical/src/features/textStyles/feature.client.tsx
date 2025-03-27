'use client'

import { $patchStyleText } from '@lexical/selection'
import { $getSelection, $isRangeSelection } from 'lexical'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStylesFeatureProps } from './feature.server.js'

import { TextStyleIcon } from '../../lexical/ui/icons/TextStyle/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'

const toolbarGroups = (props: TextStylesFeatureProps): ToolbarGroup[] => {
  const clearColor: ToolbarDropdownGroup['items'] = [
    {
      ChildComponent: () => <TextStyleIcon />,
      key: `clear-color`,
      label: 'Remove color',
      onSelect: ({ editor }) => {},
      order: 1,
    },
  ]

  const items: ToolbarDropdownGroup['items'] = []

  for (const superKey in props.styles) {
    const key = props.styles[superKey]!
    key.forEach((value) => {
      items.push({
        ChildComponent: () => <TextStyleIcon css={value.css} />,
        key: value.value,
        label: value.label,
      })
    })
  }

  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextStyleIcon />,
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
