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

export const TableHead = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead className={`${baseClass}__thead ${className || ''}`.trim()} {...rest}>
      {children}
    </thead>
  )
}

export const TableBody = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <tbody className={`${baseClass}__tbody ${className || ''}`.trim()} {...rest}>
      {children}
    </tbody>
  )
}

export const TableRow = ({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr className={`${baseClass}__tr ${className || ''}`.trim()} {...rest}>
      {children}
    </tr>
  )
}

export const TableCell = ({
  children,
  className,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td className={`${baseClass}__td ${className || ''}`.trim()} {...rest}>
      {children}
    </td>
  )
}

export const TableHeader = ({
  children,
  className,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th className={`${baseClass}__th ${className || ''}`.trim()} {...rest}>
      {children}
    </th>
  )
}

export const HiddenCell = ({
  children,
  className,
  ...rest
}: { children?: React.ReactNode } & React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td className={`${baseClass}__hidden-cell ${className || ''}`.trim()} {...rest}>
      {children}
    </td>
  )
}
