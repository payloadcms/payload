import React from 'react'

/** @internal */
export const isIPhoneUserAgent = (userAgent?: string): boolean => {
  return /\biPhone\b/.test(userAgent ?? '')
}

const defaultViewportContent = 'width=device-width, initial-scale=1'

/** @internal */
export const getViewportContent = (userAgent?: string): string => {
  return isIPhoneUserAgent(userAgent)
    ? `${defaultViewportContent}, maximum-scale=1`
    : defaultViewportContent
}

/** @internal */
export const getViewportMeta = (userAgent?: string): React.ReactNode => {
  const content = getViewportContent(userAgent)

  return <meta content={content} name="viewport" />
}
