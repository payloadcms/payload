import React from 'react'

export const isIPhoneUserAgent = (userAgent?: string): boolean => {
  return /\biPhone\b/.test(userAgent ?? '')
}

const defaultViewportContent = 'width=device-width, initial-scale=1'

export const getViewportContent = (userAgent?: string): string => {
  return isIPhoneUserAgent(userAgent)
    ? `${defaultViewportContent}, maximum-scale=1`
    : defaultViewportContent
}

export const getViewportMeta = (userAgent?: string): React.ReactNode => {
  const content = getViewportContent(userAgent)

  return <meta content={content} name="viewport" />
}
