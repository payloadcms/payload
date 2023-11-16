import React, { useEffect } from 'react'

import { useResize } from '../../../../utilities/useResize'
import { useLivePreviewContext } from '../Context/context'

export const DeviceContainer: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const deviceFrameRef = React.useRef<HTMLDivElement>(null)

  const { breakpoint, setMeasuredDeviceSize, size, zoom } = useLivePreviewContext()

  // Keep an accurate measurement of the actual device size as it is truly rendered
  // This is helpful when `sizes` are non-number units like percentages, etc.
  const { size: measuredDeviceSize } = useResize(deviceFrameRef)

  // Sync the measured device size with the context so that other components can use it
  // This happens from the bottom up so that as this component mounts and unmounts,
  // Its size is freshly populated again upon re-mounting, i.e. going from iframe->popup->iframe
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
