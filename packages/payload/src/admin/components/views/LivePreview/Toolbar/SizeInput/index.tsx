import React, { useCallback } from 'react'

import { useLivePreviewContext } from '../../PreviewContext/context'

import './index.scss'

const baseClass = 'live-preview-toolbar'

export const PreviewFrameSizeInput: React.FC<{
  axis?: 'x' | 'y'
}> = (props) => {
  const { axis } = props

  const { setWidth, setHeight, size, deviceFrameRef } = useLivePreviewContext()

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
      if (axis === 'x') {
        setWidth(Number(e.target.value))
      } else {
        setHeight(Number(e.target.value))
      }
    },
    [axis, setWidth, setHeight],
  )

  const sizeValue = axis === 'x' ? size?.width : size?.height

  return (
    <input
      className={`${baseClass}__size`}
      type="number"
      value={sizeValue}
      onChange={handleChange}
      disabled // enable this once its wired up properly
    />
  )
}
