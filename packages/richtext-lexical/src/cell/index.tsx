import type { SerializedEditorState } from 'lexical'
import type { CellComponentProps, RichTextField } from 'payload/types'

import { createHeadlessEditor } from '@lexical/headless'
import { $getRoot } from 'lexical'
import React, { useEffect } from 'react'

import type { AdapterProps } from '../types'

import { getEnabledNodes } from '../field/lexical/nodes'

export const RichTextCell: React.FC<
  CellComponentProps<RichTextField<AdapterProps>, SerializedEditorState> & AdapterProps
> = ({ data, editorConfig }) => {
  const [preview, setPreview] = React.useState('Loading...')

  useEffect(() => {
    if (data == null) {
      setPreview('')
      return
    }
    // initialize headless editor
    const headlessEditor = createHeadlessEditor({
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes(editorConfig),
      theme: editorConfig.lexical.theme,
    })
    headlessEditor.setEditorState(headlessEditor.parseEditorState(data))

    const textContent = headlessEditor.getEditorState().read(() => {
      return $getRoot().getTextContent()
    })

    setPreview(textContent)
  }, [data, editorConfig])

  return <span>{preview}</span>
}
