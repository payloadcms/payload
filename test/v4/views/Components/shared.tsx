'use client'

import type React from 'react'

import { Collapsible } from '@payloadcms/ui'

export const Section: React.FC<{
  children: React.ReactNode
  id: string
  selectedComponent: string
  title: string
}> = ({ id, children, selectedComponent, title }) => {
  if (selectedComponent !== 'all' && selectedComponent !== id) {
    return null
  }

  return (
    <section className="components-view__section" id={id}>
      <Collapsible header={<strong>{title}</strong>}>
        <div className="components-view__variants">{children}</div>
      </Collapsible>
    </section>
  )
}

export const Variant: React.FC<{
  children: React.ReactNode
  label?: string
}> = ({ children, label }) => (
  <div className="components-view__variant">
    {label && <span className="components-view__variant-label">{label}</span>}
    <div className="components-view__variant-content">{children}</div>
  </div>
)
