'use client'
import { useTableCell } from '@payloadcms/ui'
import React, { Fragment } from 'react'

export const IDCell: React.FC = () => {
  const { cellData } = useTableCell()
  return <Fragment>{cellData as number | string}</Fragment>
}
