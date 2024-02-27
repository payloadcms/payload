'use client'
import type { EditorConfig as LexicalEditorConfig } from 'lexical/LexicalEditor'

import { createHeadlessEditor } from '@lexical/headless'
import { useTableCell } from '@payloadcms/ui/elements'
import { $getRoot } from 'lexical'
import React, { useEffect } from 'react'

import type { SanitizedEditorConfig } from '../field/lexical/config/types'

import { useFieldPath } from '../../../ui/src/forms/FieldPathProvider'
import { useClientFunctions } from '../../../ui/src/providers/ClientFunction'
import { defaultEditorLexicalConfig } from '../field/lexical/config/defaultClient'
import { sanitizeEditorConfig } from '../field/lexical/config/sanitize'
import { getEnabledNodes } from '../field/lexical/nodes'

export const RichTextCell: React.FC<{
  lexicalEditorConfig: LexicalEditorConfig
}> = ({ lexicalEditorConfig }) => {
  const [preview, setPreview] = React.useState('Loading...')
  const { schemaPath } = useFieldPath()
  const clientFunctions = useClientFunctions()

  const { cellData, cellProps, columnIndex, richTextComponentMap, rowData } = useTableCell()

  useEffect(() => {
    let dataToUse = cellData
    if (dataToUse == null) {
      setPreview('')
      return
    }

    const finalSanitizedEditorConfig: SanitizedEditorConfig = sanitizeEditorConfig({
      features: [],
      lexical: lexicalEditorConfig
        ? () => Promise.resolve(lexicalEditorConfig)
        : () => Promise.resolve(defaultEditorLexicalConfig),
    })

    // Transform data through load hooks
    if (finalSanitizedEditorConfig?.features?.hooks?.load?.length) {
      finalSanitizedEditorConfig.features.hooks.load.forEach((hook) => {
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

    void finalSanitizedEditorConfig.lexical().then((lexicalConfig: LexicalEditorConfig) => {
      // initialize headless editor
      const headlessEditor = createHeadlessEditor({
        namespace: lexicalConfig.namespace,
        nodes: getEnabledNodes({ editorConfig: finalSanitizedEditorConfig }),
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
  }, [cellData, lexicalEditorConfig])

  return <span>{preview}</span>
}
