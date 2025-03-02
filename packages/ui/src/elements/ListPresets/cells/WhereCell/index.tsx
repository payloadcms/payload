import type { DefaultCellComponentProps, Where } from 'payload'

import { toWords } from 'payload/shared'
import React from 'react'

/** @todo: improve this */
const transformWhereToNaturalLanguage = (where: Where): string => {
  if (where.or && where.or.length > 0 && where.or[0].and && where.or[0].and.length > 0) {
    const orQuery = where.or[0]
    const andQuery = orQuery.and[0]
    const key = Object.keys(andQuery)[0]
    const operator = Object.keys(andQuery[key])[0]
    const value = andQuery[key][operator]

    return `${toWords(key)} ${operator} ${toWords(value)}`
  }

  return ''
}

export const ListPresetsWhereCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  return <div>{transformWhereToNaturalLanguage(cellData)}</div>
}
