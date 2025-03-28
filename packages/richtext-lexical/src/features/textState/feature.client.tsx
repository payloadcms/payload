'use client'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStateFeatureProps } from './feature.server.js'

import { TextStateIcon } from '../../lexical/ui/icons/TextState/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { registerTextStates, setTextState, StatePlugin } from './textState.js'

const toolbarGroups = (props: TextStateFeatureProps): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = []

  for (const superKey in props.styles) {
    const key = props.styles[superKey]!
    for (const value in key) {
      const meta = key[value]!
      items.push({
        ChildComponent: () => <TextStateIcon css={meta.css} />,
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
      ChildComponent: () => <TextStateIcon />,
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
      ChildComponent: () => <TextStateIcon />,
      items: [...clearStyle, ...items],
      key: 'textStates',
      order: 30,
    },
  ]
}

export const TextStateFeatureClient = createClientFeature<TextStateFeatureProps>(({ props }) => {
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
