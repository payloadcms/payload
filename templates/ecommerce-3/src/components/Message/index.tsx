import clsx from 'clsx'
import React from 'react'

/* [
          classes.message,
          className,
          error && classes.error,
          success && classes.success,
          warning && classes.warning,
          !error && !success && !warning && classes.default,
        ]
          .filter(Boolean)
          .join(' '), */

export const Message: React.FC<{
  className?: string
  error?: React.ReactNode
  message?: React.ReactNode
  success?: React.ReactNode
  warning?: React.ReactNode
}> = ({ className, error, message, success, warning }) => {
  const messageToRender = message || error || success || warning

  if (messageToRender) {
    return (
      <div
        className={clsx(
          'p-4 border border-border border-solid my-8',
          {
            'border-green-500 ': Boolean(success),
            'border-orange-500 ': Boolean(warning),
            'border-red-500 ': Boolean(error),
          },
          className,
        )}
      >
        {messageToRender}
      </div>
    )
  }
  return null
}
