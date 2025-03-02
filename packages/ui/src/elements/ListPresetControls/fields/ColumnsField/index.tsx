import type { ColumnPreference, JSONFieldServerComponent } from 'payload'

import { toWords, transformColumnsToSearchParams } from 'payload/shared'
import React from 'react'

export const ListPresetsColumnsField: JSONFieldServerComponent = ({ data }) => {
  return (
    <div>
      {transformColumnsToSearchParams(data as ColumnPreference[])
        .map((column) => toWords(column))
        .join(', ')}
    </div>
  )
}
