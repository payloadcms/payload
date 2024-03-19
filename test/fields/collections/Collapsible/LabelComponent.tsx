import type { RowLabelComponent } from 'payload/types'

import React from 'react'

export const CollapsibleLabelComponent: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'hotpink', textTransform: 'uppercase' }}>
      {data.innerCollapsible || 'Untitled'}
    </div>
  )
}
