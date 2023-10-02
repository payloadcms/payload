import React, { useCallback } from 'react'

import { useLivePreviewContext } from '../../PreviewContext/context'
import './index.scss'

const baseClass = 'live-preview-toolbar'

export const PreviewFrameSizeInput: React.FC<{
  axis?: 'x' | 'y'
}> = (props) => {
  const { axis } = props

  const { actualDeviceSize, setBreakpoint, setHeight, setWidth, size } = useLivePreviewContext()

  // const [size, setSize] = React.useState<string>(() => {
  //   if (sizeToUse === 'width') {
  //     return deviceSize?.width.toFixed(0)
  //   }

  //   return deviceSize?.height.toFixed(0)
  // })

  // useEffect(() => {
  //   if (sizeToUse === 'width') {
  //     setSize(deviceSize?.width.toFixed(0))
  //   } else {
  //     setSize(deviceSize?.height.toFixed(0))
  //   }
  // }, [deviceSize])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // setBreakpoint('custom')

      console.log(Number(e.target.value))

      if (axis === 'x') {
        setWidth(Number(e.target.value))
      } else {
        setHeight(Number(e.target.value))
      }
    },
    [axis, setWidth, setHeight, setBreakpoint],
  )

  console.log(actualDeviceSize)

  const sizeValue = axis === 'x' ? actualDeviceSize?.width : actualDeviceSize?.height

  return (
    <input
      className={`${baseClass}__size`}
      onChange={handleChange}
      type="number"
      value={sizeValue || 0}
    />
  )
}
