'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $isDecoratorNode,
  $setSelection,
} from 'lexical'
import { useEffect } from 'react'

export function DecoratorSelectionPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerRootListener((rootElem, prevRootElem) => {
      const handleMouseDown = (event: MouseEvent) => {
        if (!(event.target instanceof HTMLElement)) {
          return false
        }
        const decorator = event.target.closest('[data-lexical-decorator="true"]')
        if (!decorator) {
          return
        }
        editor.update(() => {
          const node = $getNearestNodeFromDOMNode(decorator)
          if ($isDecoratorNode(node)) {
            const selection = $createNodeSelection()
            selection.add(node.getKey())
            $setSelection(selection)
            selection.add(node.getKey())
          }
        })
      }

      if (rootElem) {
        // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener
        rootElem.addEventListener('mousedown', handleMouseDown)
      }
      if (prevRootElem) {
        prevRootElem.removeEventListener('mousedown', handleMouseDown)
      }
    })
  }, [editor])

  return null
}
