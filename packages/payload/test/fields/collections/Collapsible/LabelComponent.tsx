import React from 'react'

import type { RowLabelComponent } from '../../../../src/admin/components/forms/RowLabel/types'

export const CollapsibleLabelComponent: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'hotpink', textTransform: 'uppercase' }}>
      {data.innerCollapsible || 'Untitled'}
    </div>
  )
}
