import React from 'react'

import type { RowLabelComponent } from '../../../../packages/payload/src/admin/forms/RowLabel.js'

export const CollapsibleLabelComponent: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'hotpink', textTransform: 'uppercase' }}>
      {data.innerCollapsible || 'Untitled'}
    </div>
  )
}
