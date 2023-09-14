import React from 'react'

import type { RowLabelComponent } from '../../../../packages/payload/src/admin/components/forms/RowLabel/types'

export const ArrayRowLabel: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'coral', textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>
  )
}
