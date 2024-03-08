import React from 'react'

import type { RowLabelComponent } from '../../../../packages/payload/src/admin/forms/RowLabel.js'

export const ArrayRowLabel: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'coral', textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>
  )
}
