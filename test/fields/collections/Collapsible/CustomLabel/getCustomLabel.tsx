import type { CollapsibleField } from 'payload'
import type React from 'react'

export const getCustomLabel = ({
  fallback,
  path,
  style,
}: {
  fallback?: string
  path: string
  style: React.CSSProperties
}): CollapsibleField['admin']['components']['Label'] => {
  return {
    clientProps: {
      fallback,
      path,
      style,
    },
    path: '/collections/Collapsible/CustomLabel/index.js#CustomLabelComponent',
  }
}
