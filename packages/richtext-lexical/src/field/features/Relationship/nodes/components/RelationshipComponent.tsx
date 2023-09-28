import type { ElementFormatType } from 'lexical'

import React from 'react'

import type { RelationshipFields } from '../RelationshipNode'

type Props = {
  children?: React.ReactNode
  className?: string
  fields: RelationshipFields
  format?: ElementFormatType
  nodeKey?: string
}
export const RelationshipComponent: React.FC<Props> = (props) => {
  const { children, className } = props
  return <div>RelationshipComponent</div>
}
