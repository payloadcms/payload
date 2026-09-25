'use client'

import type { EmailFieldClientProps } from 'payload'

import React from 'react'

export const CustomLabel: React.FC<EmailFieldClientProps> = ({ path }) => {
  return (
    <label className="custom-label" htmlFor={`field-${path?.replace(/\./g, '__')}`}>
      #label
    </label>
  )
}
