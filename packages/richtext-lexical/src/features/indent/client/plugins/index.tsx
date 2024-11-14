'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_NORMAL, FOCUS_COMMAND, KEY_ESCAPE_COMMAND } from 'lexical'
import { useEffect, useState } from 'react'

import type { PluginComponent } from '../../../typesClient.js'

export const IndentPlugin: PluginComponent<undefined> = () => {
  const [editor] = useLexicalComposerContext()

  const [firefoxFlag, setFirefoxFlag] = useState<boolean>(false)

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        FOCUS_COMMAND,
        () => {
          setFirefoxFlag(false)
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          setFirefoxFlag(true)
          editor.getRootElement()?.blur()
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [editor, setFirefoxFlag])

  useEffect(() => {
    if (!firefoxFlag) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['Escape', 'Shift'].includes(e.key)) {
        setFirefoxFlag(false)
      }
      // Pressing Shift+Tab after blurring refocuses the editor in Firefox
      // we focus parent to allow exiting the editor
      if (e.shiftKey && e.key === 'Tab') {
        editor.getRootElement()?.parentElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, firefoxFlag])

  return <TabIndentationPlugin />
}
