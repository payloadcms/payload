'use client'
import React, { Fragment } from 'react'

export const IDCell: React.FC = () => {
  const cellData = '' // TODO: get cellData from props
  // const { cellData } = useTableCell()
  return <Fragment>{cellData as number | string}</Fragment>
}
