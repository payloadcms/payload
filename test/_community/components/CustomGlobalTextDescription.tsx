'use client'
import React from 'react'

export const CustomGlobalTextDescription: React.FC = () => {
  return (
    <p
      data-testid="custom-description"
      style={{ color: '#3498db', fontStyle: 'italic', margin: '4px 0' }}
    >
      This field uses a custom description from payload.config.admin.tsx
    </p>
  )
}
