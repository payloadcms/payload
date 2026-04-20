'use client'

import type { PluginComponent } from '@payloadcms/richtext-lexical'

import { useLexicalComposerContext } from '@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext'
import { defaultJSXConverters, RichText } from '@payloadcms/richtext-lexical/react'

import './style.scss'

import { useEffect, useState } from 'react'

import type { DebugViewsJSXConverterFeatureProps } from '../../server/index.js'

import { lexicalFrontendViews } from '../../../../LexicalViewsFrontend/views.js'
import { lexicalViews } from '../../../views.js'

export const RichTextPlugin: PluginComponent<DebugViewsJSXConverterFeatureProps> = ({
  clientProps,
}) => {
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
        nodeMap={
          clientProps?.type === 'default'
            ? lexicalViews['default']?.nodes
            : lexicalFrontendViews['frontend']?.nodes
        }
      />
    </div>
  )
}
