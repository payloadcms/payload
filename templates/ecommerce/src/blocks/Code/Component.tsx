import React from 'react'

import { Code } from './Component.client'
import type { DefaultDocumentIDType } from 'payload'

export type CodeBlockProps = {
  code: string
  language?: string
  blockType: 'code'
}

export const CodeBlock: React.FC<
  CodeBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = ({ className, code, language }) => {
  return (
    <div className={[className, 'not-prose'].filter(Boolean).join(' ')}>
      <Code code={code} language={language} />
    </div>
  )
}
