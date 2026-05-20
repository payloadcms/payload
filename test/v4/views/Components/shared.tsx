'use client'

import type React from 'react'

import { Collapsible } from '@payloadcms/ui'

export const Section: React.FC<{
  children: React.ReactNode
  columns?: number
  fullWidth?: boolean
  id: string
  selectedComponent: string
  title: string
}> = ({ id, children, columns, fullWidth, selectedComponent, title }) => {
  if (selectedComponent !== 'all' && selectedComponent !== id) {
    return null
  }

  return (
    <section className="components-view__section" id={id}>
      <Collapsible header={<strong>{title}</strong>}>
        <div
          className={[
            'components-view__variants',
            fullWidth && 'components-view__variants--full-width',
          ]
            .filter(Boolean)
            .join(' ')}
          style={columns ? ({ '--columns': columns } as React.CSSProperties) : undefined}
        >
          {children}
        </div>
      </Collapsible>
    </section>
  )
}

export const Variant: React.FC<{
  children: React.ReactNode
  label?: string
}> = ({ children, label }) => (
  <div className="components-view__variant">
    {label && <div className="components-view__variant-label">{label}</div>}
    <div className="components-view__variant-content">{children}</div>
  </div>
)

export const VariantRow: React.FC<{
  children: React.ReactNode
  label?: string
}> = ({ children, label }) => (
  <div className="components-view__variant-row">
    {label && <span className="components-view__variant-label">{label}</span>}
    <div className="components-view__variant-row-content">{children}</div>
  </div>
)
