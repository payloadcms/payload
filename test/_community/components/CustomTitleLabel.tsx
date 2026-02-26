'use client'
import React from 'react'

export const CustomTitleLabel: React.FC = () => {
  return (
    <label style={{ color: '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
      Custom Title (max 20 chars)
    </label>
  )
}
