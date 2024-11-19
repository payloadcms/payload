'use client'
import React from 'react'

import './index.scss'
import type { UnknownConvertedNodeData } from './types.js'

type Props = {
  data: UnknownConvertedNodeData
}

export const UnknownConvertedNodeComponent: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <div>
      Unknown converted Slate node: <strong>{data?.nodeType}</strong>
    </div>
  )
}
