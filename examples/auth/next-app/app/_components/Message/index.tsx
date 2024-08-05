import React from 'react'

import classes from './index.module.scss'

type MessageProps = {
  message?: React.ReactNode
  error?: React.ReactNode
  success?: React.ReactNode
  warning?: React.ReactNode
  className?: string
}

export function Message({ message, error, success, warning, className }: MessageProps) {
  const messageToRender = message || error || success || warning

  if (messageToRender) {
    return (
      <div
        className={[
          classes.message,
          className,
          error && classes.error,
          success && classes.success,
          warning && classes.warning,
          !error && !success && !warning && classes.default,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {messageToRender}
      </div>
    )
  }
  return null
}
