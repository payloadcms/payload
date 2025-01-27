'use client'

import React from 'react'

const CustomLabel: React.FC<{ htmlFor: string }> = ({ htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className="custom-label">
      #label
    </label>
  )
}

export default CustomLabel
