import type { PayloadClientReactComponent, RowLabelComponent } from 'payload'

import React from 'react'

export const ArrayRowLabel: PayloadClientReactComponent<RowLabelComponent> = ({ rowLabel }) => {
  return <div style={{ color: 'coral', textTransform: 'uppercase' }}>{rowLabel}</div>
}
