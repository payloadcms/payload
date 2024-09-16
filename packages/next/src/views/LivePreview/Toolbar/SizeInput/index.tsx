'use client'
import React, { useCallback, useEffect } from 'react'

import { useLivePreviewContext } from '../../Context/context.js'
import './index.scss'

const baseClass = 'toolbar-input'

export const PreviewFrameSizeInput: React.FC<{
  axis?: 'x' | 'y'
}> = (props) => {
  const { axis } = props

  const { breakpoint, measuredDeviceSize, setBreakpoint, setSize, size, zoom } =
    useLivePreviewContext()

  const [internalState, setInternalState] = React.useState<number>(
    (axis === 'x' ? measuredDeviceSize?.width : measuredDeviceSize?.height) || 0,
  )

  // when the input is changed manually, we need to set the breakpoint as `custom`
  // this will then allow us to set an explicit width and height
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = Number(e.target.value)

      if (newValue < 0) {
        newValue = 0
      }

      setInternalState(newValue)
      setBreakpoint('custom')

      // be sure to set _both_ axis values to so that the other axis doesn't fallback to 0 on initial change
      // this is because the `responsive` size is '100%' in CSS, and `0` in initial state
      setSize({
        type: 'reset',
        value: {
          height: axis === 'y' ? newValue : Number(measuredDeviceSize?.height.toFixed(0)) * zoom,
          width: axis === 'x' ? newValue : Number(measuredDeviceSize?.width.toFixed(0)) * zoom,
        },
      })
    },
    [axis, setBreakpoint, measuredDeviceSize, setSize, zoom],
  )

  // if the breakpoint is `responsive` then the device's div will have `100%` width and height
  // so we need to take the measurements provided by `actualDeviceSize` and sync internal state
  useEffect(() => {
    if (breakpoint === 'responsive' && measuredDeviceSize) {
      if (axis === 'x') {
        setInternalState(Number(measuredDeviceSize.width.toFixed(0)) * zoom)
      } else {
        setInternalState(Number(measuredDeviceSize.height.toFixed(0)) * zoom)
      }
    }

    if (breakpoint !== 'responsive' && size) {
      setInternalState(axis === 'x' ? size.width : size.height)
    }
  }, [breakpoint, axis, measuredDeviceSize, size, zoom])

  return (
    <input
      className={baseClass}
      min={0}
      name={axis === 'x' ? 'live-preview-width' : 'live-preview-height'}
      onChange={handleChange}
      step={1}
      type="number"
      value={internalState || 0}
    />
  )
}
