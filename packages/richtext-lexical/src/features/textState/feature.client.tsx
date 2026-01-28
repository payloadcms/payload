'use client'

import type { ToolbarDropdownGroup, ToolbarGroup } from '../toolbars/types.js'
import type { TextStateFeatureProps } from './feature.server.js'

import { TextStateIcon } from '../../lexical/ui/icons/TextState/index.js'
import { createClientFeature } from '../../utilities/createClientFeature.js'
import { registerTextStates, setTextState, type StateMap, StatePlugin } from './textState.js'

const toolbarGroups = (props: TextStateFeatureProps, stateMap: StateMap): ToolbarGroup[] => {
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
          setTextState(editor, stateMap, stateKey, stateValue)
        },
      })
    }
  }

  const clearStyle: ToolbarDropdownGroup['items'] = [
    {
      ChildComponent: () => <TextStateIcon />,
      key: `clear-style`,
      label: ({ i18n }) => i18n.t('lexical:textState:defaultStyle'),
      onSelect: ({ editor }) => {
        for (const stateKey in props.state) {
          setTextState(editor, stateMap, stateKey, undefined)
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
  const stateMap = registerTextStates(props.state)
  return {
    plugins: [
      {
        Component: () => StatePlugin({ stateMap }),
        position: 'normal',
      },
    ],
    toolbarFixed: {
      groups: toolbarGroups(props, stateMap),
    },
    toolbarInline: {
      groups: toolbarGroups(props, stateMap),
    },
  }
})
