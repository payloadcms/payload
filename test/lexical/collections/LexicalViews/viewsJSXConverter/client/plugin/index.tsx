'use client'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { defaultJSXConverters, RichText } from '@payloadcms/richtext-lexical/react'
import { useEffect, useState } from 'react'

import './style.scss'
import { lexicalViews } from '../../../views.js'

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
      <RichText
        converters={defaultJSXConverters}
        data={editorState}
        nodeMap={lexicalViews['default']}
      />
    </div>
  )
}
