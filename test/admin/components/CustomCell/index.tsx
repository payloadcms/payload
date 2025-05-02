'use client'

import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

export const CustomCell: React.FC<DefaultCellComponentProps> = (props) => {
  return <div>{`Custom cell: ${props?.rowData?.customCell || 'No data'}`}</div>
}
