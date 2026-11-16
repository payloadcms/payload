import type { DefaultServerCellComponentProps } from 'payload'

import React from 'react'

export const UICustomServerCell: React.FC<DefaultServerCellComponentProps> = ({ rowData }) => {
  return <span className="ui-custom-server-cell">{`cell: ${rowData?.text}`}</span>
}
