'use client'
import type { SerializedEditorState } from 'lexical'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'
import type { CellComponentProps, RichTextField } from 'payload/types'

import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot } from 'lexical'
import React, { useEffect } from 'react'

import type { AdapterProps } from '../types'

import { getEnabledNodes } from '../field/lexical/nodes'

export const RichTextCell: React.FC<
  CellComponentProps<
    RichTextField<SerializedEditorState, AdapterProps, AdapterProps>,
    SerializedEditorState
  > &
    AdapterProps
> = ({ data, editorConfig }) => {
  const [preview, setPreview] = React.useState('Loading...')

  useEffect(() => {
    let dataToUse = data
    if (dataToUse == null) {
      setPreview('')
      return
    }

    // Transform data through load hooks
    if (editorConfig?.features?.hooks?.load?.length) {
      editorConfig.features.hooks.load.forEach((hook) => {
        dataToUse = hook({ incomingEditorState: dataToUse })
      })
    }

    if (!dataToUse || typeof dataToUse !== 'object') {
      setPreview('')
      return
    }

    // If data is from Slate and not Lexical
    if (Array.isArray(dataToUse) && !('root' in dataToUse)) {
      setPreview('')
      return
    }

    // If data is from payload-plugin-lexical
    if ('jsonContent' in dataToUse) {
      setPreview('')
      return
    }

    editorConfig.lexical().then((lexicalConfig: LexicalEditorConfig) => {
      // initialize headless editor
      const headlessEditor = createHeadlessEditor({
        namespace: lexicalConfig.namespace,
        nodes: getEnabledNodes({ editorConfig }),
        theme: lexicalConfig.theme,
      })
      headlessEditor.setEditorState(headlessEditor.parseEditorState(dataToUse))

      const textContent =
        headlessEditor.getEditorState().read(() => {
          return $getRoot().getTextContent()
        }) || ''

      // Limiting the number of characters shown is done in a CSS rule
      setPreview(textContent)
    })
  }, [data, editorConfig])

  return <span>{preview}</span>
}
