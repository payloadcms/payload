'use client'
import React from 'react'

import type { UnknownConvertedNodeData } from './index.js'

import './index.scss'

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
