'use client'
import type { ThemedToken } from 'shiki'
import React, { useEffect, useState } from 'react'
import { codeToTokens } from 'shiki'
import { CopyButton } from './CopyButton'

type Props = {
  code: string
  language?: string
}

export const Code: React.FC<Props> = ({ code, language = '' }) => {
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null)

  useEffect(() => {
    if (!code) return

    codeToTokens(code, {
      lang: language || 'text',
      theme: 'github-dark',
    })
      .then((result) => setTokens(result.tokens))
      .catch(console.error)
  }, [code, language])

  if (!code) return null

  return (
    <pre className="bg-black p-4 border text-xs border-border rounded overflow-x-auto">
      {(tokens ?? code.split('\n').map((line) => [{ content: line, color: undefined }])).map(
        (line, i) => (
          <div key={i} className="table-row">
            <span className="table-cell select-none text-right text-white/25">{i + 1}</span>
            <span className="table-cell pl-4">
              {line.map((token, key) => (
                <span key={key} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
            </span>
          </div>
        ),
      )}
      <CopyButton code={code} />
    </pre>
  )
}
