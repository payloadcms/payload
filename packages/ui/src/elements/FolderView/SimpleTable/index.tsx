'use client'

import React from 'react'

import './index.scss'

const baseClass = 'simple-table'

type TableProps = {
  readonly appearance?: 'condensed' | 'default'
  readonly className?: string
  readonly headerCells: React.ReactNode[]
  readonly tableRows: React.ReactNode[]
}
export const SimpleTable = ({
  appearance,
  className,
  headerCells: headers,
  tableRows: rows,
}: TableProps) => {
  return (
    <div
      className={[className, baseClass, appearance && `${baseClass}--appearance-${appearance}`]
        .filter(Boolean)
        .join(' ')}
    >
      <table cellPadding={0} cellSpacing={0} className={`${baseClass}__table`}>
        <TableHead>
          <TableRow>{headers}</TableRow>
        </TableHead>

        <TableBody>{rows}</TableBody>
      </table>
    </div>
  )
}

type TableElementProps = {
  readonly children: React.ReactNode
  readonly className?: string
}

export const TableHead = ({ children, className }: TableElementProps) => {
  return <thead className={`${baseClass}__thead ${className || ''}`.trim()}>{children}</thead>
}

export const TableBody = ({ children, className }: TableElementProps) => {
  return <tbody className={`${baseClass}__tbody ${className || ''}`.trim()}>{children}</tbody>
}

export const TableRow = ({ children, className }: TableElementProps) => {
  return <tr className={`${baseClass}__tr ${className || ''}`.trim()}>{children}</tr>
}

export const TableCell = ({ children, className }: TableElementProps) => {
  return <td className={`${baseClass}__td ${className || ''}`.trim()}>{children}</td>
}

export const TableHeader = ({ children, className }: TableElementProps) => {
  return <th className={`${baseClass}__th ${className || ''}`.trim()}>{children}</th>
}

export const HiddenCell = ({
  children,
  className,
}: { children?: React.ReactNode } & Omit<TableElementProps, 'children'>) => {
  return <td className={`${baseClass}__hidden-cell ${className || ''}`.trim()}>{children}</td>
}
