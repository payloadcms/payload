import React from 'react'

import { useLivePreviewContext } from '../Context/context'

export const DeviceContainer: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { breakpoint, deviceFrameRef, size, zoom } = useLivePreviewContext()

  let x = '0'
  let margin = '0'

  if (breakpoint && breakpoint !== 'responsive') {
    x = '-50%'

    if (
      typeof zoom === 'number' &&
      typeof size.width === 'number' &&
      typeof size.height === 'number'
    ) {
      const scaledWidth = size.width / zoom
      const difference = scaledWidth - size.width
      x = `${difference / 2}px`
      margin = 'auto'
    }
  }

  let width = zoom ? `${100 / zoom}%` : '100%'
  let height = zoom ? `${100 / zoom}%` : '100%'

  if (breakpoint !== 'responsive') {
    width = `${size?.width / (typeof zoom === 'number' ? zoom : 1)}px`
    height = `${size?.height / (typeof zoom === 'number' ? zoom : 1)}px`
  }

  return (
    <div
      ref={deviceFrameRef}
      style={{
        height,
        margin,
        transform: `translate3d(${x}, 0, 0)`,
        width,
      }}
    >
      {children}
    </div>
  )
}
