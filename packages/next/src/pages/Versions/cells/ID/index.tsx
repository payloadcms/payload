'use client'
import React, { Fragment } from 'react'
import { useTableCell } from '@payloadcms/ui'

export const IDCell: React.FC = () => {
  const { cellData } = useTableCell()
  return <Fragment>{cellData}</Fragment>
}
