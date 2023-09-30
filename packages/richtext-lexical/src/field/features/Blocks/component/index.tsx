import type { ElementFormatType } from 'lexical'

import React from 'react'

import type { BlockFields } from '../nodes/BlocksNode'

type Props = {
  children?: React.ReactNode
  className?: string
  fields: BlockFields
  format?: ElementFormatType
  nodeKey?: string
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { children, className, fields, format, nodeKey } = props

  return <div className="className">Block</div>
}
