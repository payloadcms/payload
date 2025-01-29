'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useState } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { defaultJSXConverters, RichText } from '../../../../../exports/react/index.js'

export function RichTextPlugin() {
  const [editor] = useLexicalComposerContext()
  const [editorState, setEditorState] = useState(editor.getEditorState().toJSON())

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      setEditorState(editorState.toJSON())
    })
  }, [editor])

  return (
    <RichText
      converters={defaultJSXConverters}
      data={editorState}
      // className={cn(
      //   {
      //     'container ': enableGutter,
      //     'max-w-none': !enableGutter,
      //     'mx-auto prose md:prose-md dark:prose-invert ': enableProse,
      //   },
      //   className,
      // )}
    />
  )
}
