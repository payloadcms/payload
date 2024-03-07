'use client'
import React from 'react'

import { useLivePreviewContext } from '../Context/context.js'

export const DeviceContainer: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { breakpoint, breakpoints, size, zoom } = useLivePreviewContext()

  const foundBreakpoint = breakpoint && breakpoints?.find((bp) => bp.name === breakpoint)

  let x = '0'
  let margin = '0'

  if (foundBreakpoint && breakpoint !== 'responsive') {
    x = '-50%'

    if (
      typeof zoom === 'number' &&
      typeof size.width === 'number' &&
      typeof size.height === 'number'
    ) {
      const scaledWidth = size.width / zoom
      const difference = scaledWidth - size.width
      x = `${difference / 2}px`
      margin = '0 auto'
    }
  }

  return (
    <div
      style={{
        height:
          foundBreakpoint && foundBreakpoint?.name !== 'responsive'
            ? `${size?.height / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
              ? `${100 / zoom}%`
              : '100%',
        margin,
        transform: `translate3d(${x}, 0, 0)`,
        width:
          foundBreakpoint && foundBreakpoint?.name !== 'responsive'
            ? `${size?.width / (typeof zoom === 'number' ? zoom : 1)}px`
            : typeof zoom === 'number'
              ? `${100 / zoom}%`
              : '100%',
      }}
    >
      {children}
    </div>
  )
}
