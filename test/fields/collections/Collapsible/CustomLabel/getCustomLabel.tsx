import React from 'react'

import { CustomLabelComponent } from './index.js'

export const getCustomLabel = ({
  fallback,
  path,
  style,
}: {
  fallback?: string
  path: string
  style: React.CSSProperties
}) => {
  return <CustomLabelComponent fallback={fallback} path={path} style={style} />
}
