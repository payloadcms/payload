import type { LexicalEditor, StateConfig } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $forEachSelectedTextNode } from '@lexical/selection'
import { $getNodeByKey, $getState, $setState, createState, TextNode } from 'lexical'
import { useEffect } from 'react'

import { type TextStylesFeatureProps } from './feature.server.js'

const stateMap = new Map<
  string,
  {
    meta: TextStylesFeatureProps['styles'][number]
    stateConfig: StateConfig<string, string | undefined>
  }
>()

export function registerTextStates(styles: TextStylesFeatureProps['styles']) {
  for (const stateKey in styles) {
    const acceptedValues = Object.keys(styles[stateKey]!)
    const state = createState(stateKey, {
      parse: (value) =>
        typeof value === 'string' && acceptedValues?.includes(value) ? value : undefined,
    })
    stateMap.set(stateKey, { meta: styles[stateKey]!, stateConfig: state })
  }
}

export function setTextState(editor: LexicalEditor, stateKey: string, value: string | undefined) {
  editor.update(() => {
    $forEachSelectedTextNode((textNode) => {
      const stateEntry = stateMap.get(stateKey)
      if (!stateEntry) {
        throw new Error(`State config for ${stateKey} not found`)
      }
      $setState(textNode, stateEntry.stateConfig, value)
    })
  })
}

export function StatePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerMutationListener(TextNode, (mutatedNodes) => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            continue
          }
          const node = $getNodeByKey(nodeKey)
          const dom = editor.getElementByKey(nodeKey)
          if (!node || !dom) {
            continue
          }
          // stateKey could be color for example
          stateMap.forEach((stateEntry, _stateKey) => {
            // stateValue could be bg-red for example
            const stateValue = $getState(node, stateEntry.stateConfig)
            if (!stateValue) {
              return
            }
            const css = stateEntry.meta[stateValue]?.css
            if (!css) {
              return
            }
            Object.entries(css).forEach(([key, value]) => {
              dom.style.setProperty(key, value)
            })
          })
        }
      })
    })
  }, [editor])

  return null
}
