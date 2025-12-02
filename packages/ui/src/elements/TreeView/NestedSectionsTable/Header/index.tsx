import React from 'react'

import './index.scss'

const baseClass = 'nested-sections-table-header'

interface Column {
  label?: string
  name: string
}

interface HeaderProps {
  columns: Column[]
}

export const Header: React.FC<HeaderProps> = ({ columns }) => {
  return (
    <div className={baseClass}>
      <div className={`${baseClass}__cell`}>{/* Drag handle column header */}</div>
      {columns.map((col) => (
        <div className={`${baseClass}__cell`} key={col.name}>
          {col.label || col.name}
        </div>
      ))}
    </div>
  )
}
