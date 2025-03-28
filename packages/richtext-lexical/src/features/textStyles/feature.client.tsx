'use client'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStylesFeatureProps } from './feature.server.js'

import { TextStyleIcon } from '../../lexical/ui/icons/TextStyle/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { registerTextStates, setTextState, StatePlugin } from './textState.js'

const toolbarGroups = (props: TextStylesFeatureProps): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = []

  for (const superKey in props.styles) {
    const key = props.styles[superKey]!
    for (const value in key) {
      const meta = key[value]!
      items.push({
        ChildComponent: () => <TextStyleIcon css={meta.css} />,
        key: value,
        label: meta.label,
        onSelect: ({ editor }) => {
          setTextState(editor, superKey, value)
        },
      })
    }
  }

  const clearStyle: ToolbarDropdownGroup['items'] = [
    {
      ChildComponent: () => <TextStyleIcon />,
      key: `clear-style`,
      label: 'Default style',
      onSelect: ({ editor }) => {
        for (const superKey in props.styles) {
          setTextState(editor, superKey, undefined)
        }
      },
      order: 1,
    },
  ]

  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextStyleIcon />,
      items: [...clearStyle, ...items],
      key: 'textStyles',
      order: 30,
    },
  ]
}

export const TextStylesFeatureClient = createClientFeature<TextStylesFeatureProps>(({ props }) => {
  registerTextStates(props.styles)
  return {
    plugins: [
      {
        Component: StatePlugin,
        position: 'normal',
      },
    ],
    toolbarFixed: {
      groups: toolbarGroups(props),
    },
    toolbarInline: {
      groups: toolbarGroups(props),
    },
  }
})
