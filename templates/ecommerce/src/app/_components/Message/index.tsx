import React from 'react'

import classes from './index.module.scss'

export const Message: React.FC<{
  message?: string | null
  error?: string | null
  success?: string | null
  warning?: string | null
  className?: string
}> = ({ message, error, success, warning, className }) => {
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
