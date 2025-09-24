'use client'

import type { DefaultCellComponentProps } from 'payload'

import React from 'react'

export const CustomGroupCell: React.FC<DefaultCellComponentProps> = (props) => {
  return <div>{`Custom group cell: ${props?.rowData?.title || 'No data'}`}</div>
}
