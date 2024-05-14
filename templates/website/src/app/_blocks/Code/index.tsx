import React from 'react'

import classes from './index.module.scss'

type Props = {
  code: string
  language?: string
}

export const CodeBlock: React.FC<Props> = ({ code }) => {
  return (
    <div className={[classes.container].filter(Boolean).join(' ')}>
      <pre className={classes.pre}>
        <code className={classes.code}>{code}</code>
      </pre>
    </div>
  )
}
