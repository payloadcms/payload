import type { ColumnPreference, DefaultCellComponentProps } from '@ruya.sa/payload'

import { toWords, transformColumnsToSearchParams } from '@ruya.sa/payload/shared'
import React from 'react'

import { Pill } from '../../../Pill/index.js'
import './index.scss'

const baseClass = 'query-preset-columns-cell'

export const QueryPresetsColumnsCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  return (
    <div className={baseClass}>
      {cellData
        ? transformColumnsToSearchParams(cellData as ColumnPreference[]).map((column, i) => {
            const isColumnActive = !column.startsWith('-')

            // to void very lengthy cells, only display the active columns
            if (!isColumnActive) {
              return null
            }

            return (
              <Pill key={i} pillStyle={isColumnActive ? 'always-white' : 'light'} size="small">
                {toWords(column)}
              </Pill>
            )
          })
        : 'No columns selected'}
    </div>
  )
}
