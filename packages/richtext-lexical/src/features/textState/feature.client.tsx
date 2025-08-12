'use client'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStateFeatureProps } from './feature.server.js'

import { TextStateIcon } from '../../lexical/ui/icons/TextState/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { registerTextStates, setTextState, StatePlugin } from './textState.js'

const toolbarGroups = (props: TextStateFeatureProps): ToolbarGroup[] => {
  const items: ToolbarDropdownGroup['items'] = []

  for (const stateKey in props.state) {
    const key = props.state[stateKey]!
    for (const stateValue in key) {
      const meta = key[stateValue]!
      items.push({
        ChildComponent: () => <TextStateIcon css={meta.css} />,
        key: stateValue,
        label: meta.label,
        onSelect: ({ editor }) => {
          setTextState(editor, stateKey, stateValue)
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
        for (const stateKey in props.state) {
          setTextState(editor, stateKey, undefined)
        }
      },
      order: 1,
    },
  ]

  return [
    {
      type: 'dropdown',
      ChildComponent: () => <TextStateIcon css={{ color: 'var(--theme-elevation-600)' }} />,
      items: [...clearStyle, ...items],
      key: 'textState',
      order: 30,
    },
  ]
}

export const TextStateFeatureClient = createClientFeature<TextStateFeatureProps>(({ props }) => {
  registerTextStates(props.state)
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
