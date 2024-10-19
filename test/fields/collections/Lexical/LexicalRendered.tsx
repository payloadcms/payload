'use client'
import type { SerializedEditorState } from 'lexical'

import {
  BlocksJSXConverter,
  type JSXConvertersFunction,
  RichText,
} from '@payloadcms/richtext-lexical/react'
import { useConfig, useDocumentInfo, usePayloadAPI } from '@payloadcms/ui'
import React from 'react'

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => [
  ...defaultConverters,
  BlocksJSXConverter({
    blocks: {
      myTextBlock: ({ fields }) => <div style={{ backgroundColor: 'red' }}>{fields.text}</div>,
    },
  }),
]

export const LexicalRendered: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const [{ data }] = usePayloadAPI(`${serverURL}${api}/${collectionSlug}/${id}`, {
    initialParams: {
      depth: 1,
    },
  })

  if (!data.lexicalWithBlocks) {
    return null
  }

  return (
    <div>
      <h1>Rendered:</h1>
      <RichText
        converters={jsxConverters}
        editorState={data.lexicalWithBlocks as SerializedEditorState}
      />
      <h1>Raw JSON:</h1>
      <pre>{JSON.stringify(data.lexicalWithBlocks, null, 2)}</pre>
    </div>
  )
}
