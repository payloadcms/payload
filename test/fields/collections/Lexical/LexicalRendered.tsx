'use client'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react'
import { useConfig, useDocumentInfo, usePayloadAPI } from '@payloadcms/ui'
import React from 'react'

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  block: {
    myTextBlock: ({ node }) => <div style={{ backgroundColor: 'red' }}>{node.fields.text}</div>,
    relationshipBlock: ({ node, nodesToJSX }) => {
      return <p>Test</p>
    },
  },
})

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
      <RichText converters={jsxConverters} data={data.lexicalWithBlocks as SerializedEditorState} />
      <h1>Raw JSON:</h1>
      <pre>{JSON.stringify(data.lexicalWithBlocks, null, 2)}</pre>
    </div>
  )
}
