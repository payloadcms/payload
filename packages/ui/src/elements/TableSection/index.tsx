import React from 'react'

import './index.css'

const baseClass = 'table-section'

export type TableSectionProps = {
  children: React.ReactNode
  className?: string
  'data-group-id'?: string
}

export type TableSectionHeaderProps = {
  children?: React.ReactNode
  className?: string
  heading?: string
}

export type TableSectionContentProps = {
  children: React.ReactNode
  className?: string
}

export type TableSectionFooterProps = {
  children: React.ReactNode
  className?: string
}

export function TableSectionRoot({
  children,
  className,
  'data-group-id': dataGroupId,
}: TableSectionProps) {
  return (
    <div className={[baseClass, className].filter(Boolean).join(' ')} data-group-id={dataGroupId}>
      <div className={`${baseClass}__divider`} />
      {children}
    </div>
  )
}

export function TableSectionHeader({ children, className, heading }: TableSectionHeaderProps) {
  return (
    <header className={[`${baseClass}__header`, className].filter(Boolean).join(' ')}>
      <div className={`${baseClass}__header-inner`}>
        {heading && <h4 className={`${baseClass}__heading`}>{heading}</h4>}
        {children}
      </div>
    </header>
  )
}

export function TableSectionContent({ children, className }: TableSectionContentProps) {
  return (
    <div className={[`${baseClass}__content`, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export function TableSectionFooter({ children, className }: TableSectionFooterProps) {
  return (
    <div className={[`${baseClass}__footer`, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

// Compound component for client usage
export const TableSection = Object.assign(TableSectionRoot, {
  Content: TableSectionContent,
  Footer: TableSectionFooter,
  Header: TableSectionHeader,
})
