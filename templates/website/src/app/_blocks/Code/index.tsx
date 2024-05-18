import React from 'react'

import { Code } from './Code.client'
type Props = {
  code: string
  language?: string
}

export const CodeBlock: React.FC<Props> = ({ code, language }) => {
  return (
    <div className={['not-prose'].filter(Boolean).join(' ')}>
      <Code code={code} language={language} />
    </div>
  )
}
