'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'

import { defaultJSXConverters } from '../../../../converters/jsx/converter/defaultConverters.js'
import { RichText } from '../../../../converters/jsx/index.js'

export function RichTextPlugin() {
  const [editor] = useLexicalComposerContext()
  const [editorState, setEditorState] = useState(editor.getEditorState().toJSON())

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      setEditorState(editorState.toJSON())
    })
  }, [editor])

  return <RichText converters={defaultJSXConverters} data={editorState} />
}
