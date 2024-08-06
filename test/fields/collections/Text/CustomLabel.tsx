'use client'

import React from 'react'

const CustomLabel = ({ htmlFor }: { htmlFor: string }) => {
  return (
    <label htmlFor={htmlFor} className="custom-label">
      #label
    </label>
  )
}

export default CustomLabel
