'use client'
import { useResize } from '@payloadcms/ui'
import React, { useEffect } from 'react'

import { useLivePreviewContext } from '../Context/context.js'

export const DeviceContainer: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const deviceFrameRef = React.useRef<HTMLDivElement>(null)
  const outerFrameRef = React.useRef<HTMLDivElement>(null)

  const { breakpoint, setMeasuredDeviceSize, size: desiredSize, zoom } = useLivePreviewContext()

  // Keep an accurate measurement of the actual device size as it is truly rendered
  // This is helpful when `sizes` are non-number units like percentages, etc.
  const { size: measuredDeviceSize } = useResize(deviceFrameRef.current)
  const { size: outerFrameSize } = useResize(outerFrameRef.current)

  let deviceIsLargerThanFrame: boolean = false

  // Sync the measured device size with the context so that other components can use it
  // This happens from the bottom up so that as this component mounts and unmounts,
  // its size is freshly populated again upon re-mounting, i.e. going from iframe->popup->iframe
  useEffect(() => {
    if (measuredDeviceSize) {
      setMeasuredDeviceSize(measuredDeviceSize)
    }
  }, [measuredDeviceSize, setMeasuredDeviceSize])

  let x = '0'
  let margin = '0'

  if (breakpoint && breakpoint !== 'responsive') {
    x = '-50%'

    if (
      desiredSize &&
      measuredDeviceSize &&
      typeof zoom === 'number' &&
      typeof desiredSize.width === 'number' &&
      typeof desiredSize.height === 'number' &&
      typeof measuredDeviceSize.width === 'number' &&
      typeof measuredDeviceSize.height === 'number'
    ) {
      margin = '0 auto'
      const scaledDesiredWidth = desiredSize.width / zoom
      const scaledDeviceWidth = measuredDeviceSize.width * zoom
      const scaledDeviceDifferencePixels = scaledDesiredWidth - desiredSize.width
      deviceIsLargerThanFrame = scaledDeviceWidth > outerFrameSize.width

      if (deviceIsLargerThanFrame) {
        if (zoom > 1) {
          const differenceFromDeviceToFrame = measuredDeviceSize.width - outerFrameSize.width
          if (differenceFromDeviceToFrame < 0) {
            x = `${differenceFromDeviceToFrame / 2}px`
          } else {
            x = '0'
          }
        } else {
          x = '0'
        }
      } else {
        if (zoom >= 1) {
          x = `${scaledDeviceDifferencePixels / 2}px`
        } else {
          const differenceFromDeviceToFrame = outerFrameSize.width - scaledDeviceWidth
          x = `${differenceFromDeviceToFrame / 2}px`
          margin = '0'
        }
      }
    }
  }

  let width = zoom ? `${100 / zoom}%` : '100%'
  let height = zoom ? `${100 / zoom}%` : '100%'

  if (breakpoint !== 'responsive') {
    width = `${desiredSize?.width / (typeof zoom === 'number' ? zoom : 1)}px`
    height = `${desiredSize?.height / (typeof zoom === 'number' ? zoom : 1)}px`
  }

  return (
    <div
      ref={outerFrameRef}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
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
    </div>
  )
}
