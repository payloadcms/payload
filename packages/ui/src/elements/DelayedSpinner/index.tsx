'use client'

import React, { useEffect, useState } from 'react'

import { Spinner } from '../Spinner/index.js'

export type DelayedSpinnerProps = {
  /**
   * Base CSS class name for the wrapper
   */
  baseClass?: string
  /**
   * Delay in milliseconds before showing the spinner
   * @default 200
   */
  delay?: number
  /**
   * Whether loading is in progress
   */
  isLoading: boolean
  /**
   * Custom spinner props to pass through
   */
  spinnerProps?: React.ComponentProps<typeof Spinner>
}

export const DelayedSpinner: React.FC<DelayedSpinnerProps> = ({
  baseClass,
  delay = 200,
  isLoading,
  spinnerProps,
}) => {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [delay, isLoading])

  if (!showLoading) {
    return null
  }

  const className = baseClass || 'delayed-spinner'

  return (
    <div className={`${className}__loading`}>
      <Spinner {...spinnerProps} />
    </div>
  )
}
