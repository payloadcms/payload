import type { RowLabelComponent } from 'payload/types'

import React from 'react'

export const ArrayRowLabel: RowLabelComponent = ({ data }) => {
  return (
    <div style={{ color: 'coral', textTransform: 'uppercase' }}>{data.title || 'Untitled'}</div>
  )
}
