'use client'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { getRestPopulateFn } from '@payloadcms/richtext-lexical/client'
import {
  convertLexicalToHTML,
  type HTMLConvertersFunction,
} from '@payloadcms/richtext-lexical/html'
import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react'
import { useConfig, useDocumentInfo, usePayloadAPI } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

const jsxConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    myTextBlock: ({ node }) => <div style={{ backgroundColor: 'red' }}>{node.fields.text}</div>,
    relationshipBlock: ({ node, nodesToJSX }) => {
      return <p>Test</p>
    },
  },
})

const htmlConverters: HTMLConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    myTextBlock: ({ node }) => `<div style="background-color: red;">${node.fields.text}</div>`,
    relationshipBlock: () => {
      return `<p>Test</p>`
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

  const [{ data: unpopulatedData }] = usePayloadAPI(`${serverURL}${api}/${collectionSlug}/${id}`, {
    initialParams: {
      depth: 0,
    },
  })

  const [html, setHTML] = useState<null | string>(null)
  const [htmlFromUnpopulatedData, setHtmlFromUnpopulatedData] = useState<null | string>(null)

  useEffect(() => {
    void convertLexicalToHTML({
      converters: htmlConverters,
      data: data.lexicalWithBlocks as SerializedEditorState,
    }).then((html) => {
      setHTML(html)
    })
  }, [data.lexicalWithBlocks])

  useEffect(() => {
    async function convert() {
      const html = await convertLexicalToHTML({
        converters: htmlConverters,
        data: unpopulatedData.lexicalWithBlocks as SerializedEditorState,
        populate: await getRestPopulateFn({
          apiURL: `${serverURL}${api}`,
          depth: 0,
          draft: false,
        }),
      })

      setHtmlFromUnpopulatedData(html)
    }
    void convert()
  }, [unpopulatedData.lexicalWithBlocks, api, serverURL])

  if (!data.lexicalWithBlocks) {
    return null
  }

  return (
    <div>
      <h1>Rendered JSX:</h1>
      <RichText converters={jsxConverters} data={data.lexicalWithBlocks as SerializedEditorState} />
      <h1>Rendered HTML:</h1>
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
      <h1>Rendered HTML 2:</h1>
      {htmlFromUnpopulatedData && (
        <div dangerouslySetInnerHTML={{ __html: htmlFromUnpopulatedData }} />
      )}
      <h1>Raw JSON:</h1>
      <pre>{JSON.stringify(data.lexicalWithBlocks, null, 2)}</pre>
    </div>
  )
}
