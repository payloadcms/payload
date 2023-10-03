import React, { useCallback, useEffect } from 'react'

import { useLivePreviewContext } from '../../Context/context'
import './index.scss'

const baseClass = 'toolbar-input'

export const PreviewFrameSizeInput: React.FC<{
  axis?: 'x' | 'y'
}> = (props) => {
  const { axis } = props

  const { breakpoint, measuredDeviceSize, setBreakpoint, setHeight, setWidth, size } =
    useLivePreviewContext()

  const [internalState, setInternalState] = React.useState<number>(
    (axis === 'x' ? measuredDeviceSize?.width : measuredDeviceSize?.height) || 0,
  )

  // when the input is changed manually, we need to set the breakpoint as `custom`
  // this will then allow us to set an explicit width and height
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setInternalState(newValue)

      setBreakpoint('custom')

      if (axis === 'x') setWidth(newValue)
      else setHeight(newValue)
    },
    [axis, setWidth, setHeight, setBreakpoint],
  )

  // if the breakpoint is `responsive` then the div will have `100%` width and height
  // so we need to take the measurements provided by `actualDeviceSize` and sync internal state
  useEffect(() => {
    if (breakpoint === 'responsive' && measuredDeviceSize) {
      if (axis === 'x') setInternalState(Number(measuredDeviceSize.width.toFixed(0)))
      else setInternalState(Number(measuredDeviceSize.height.toFixed(0)))
    }

    if (breakpoint !== 'responsive' && size) {
      setInternalState(axis === 'x' ? size.width : size.height)
    }
  }, [breakpoint, axis, measuredDeviceSize, size])

  return (
    <input className={baseClass} onChange={handleChange} type="number" value={internalState || 0} />
  )
}
