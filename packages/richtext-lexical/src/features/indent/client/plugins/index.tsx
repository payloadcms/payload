'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { COMMAND_PRIORITY_LOW, FOCUS_COMMAND, KEY_ESCAPE_COMMAND } from 'lexical'
import { useEffect, useState } from 'react'

import type { PluginComponent } from '../../../typesClient.js'

export const IndentPlugin: PluginComponent<undefined> = () => {
  const [editor] = useLexicalComposerContext()

  const [tabIndentEnabled, setTabIndentEnabled] = useState<boolean>(true)

  useEffect(() => {
    const handleFocus = () => {
      // Ensure the tab indent plugin is enabled on first visit to the editor
      setTabIndentEnabled(true)
    }

    const handleEscape = () => {
      setTabIndentEnabled(false)
    }

    const unregisterFocus = editor.registerCommand<MouseEvent>(
      FOCUS_COMMAND,
      () => {
        handleFocus()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )

    const unregisterEscape = editor.registerCommand<KeyboardEvent>(
      KEY_ESCAPE_COMMAND,
      () => {
        handleEscape()
        return true
      },
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      unregisterFocus()
      unregisterEscape()
    }
  }, [editor])

  useEffect(() => {
    if (tabIndentEnabled) {
      return
    }

    const rootElement = editor.getRootElement()

    // Manually blur the editor when the escape key is pressed
    rootElement?.blur()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (tabIndentEnabled || ['Escape', 'Shift'].includes(e.key)) {
        return
      }

      // Pressing shift + tab after blurring the editor leads to the editor being re-focused
      // This manually sets the focus to the parent element to allow backwards tabbing to work as expected
      if (e.shiftKey && e.key === 'Tab') {
        rootElement?.parentElement?.focus()
      }

      setTabIndentEnabled(true)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, tabIndentEnabled])

  if (!tabIndentEnabled) {
    return null
  }

  return <TabIndentationPlugin />
}
