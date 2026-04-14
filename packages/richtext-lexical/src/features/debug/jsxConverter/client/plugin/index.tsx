'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { defaultJSXConverters, RichText } from '../../../../../exports/react/index.js'
import './style.scss'

export function RichTextPlugin() {
  const [editor] = useLexicalComposerContext()
  const [editorState, setEditorState] = useState(() => editor.getEditorState().toJSON())

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      setEditorState(editorState.toJSON())
    })
  }, [editor])

  return (
    <div className="debug-jsx-converter">
      <RichText converters={defaultJSXConverters} data={editorState} />
    </div>
  )
}
