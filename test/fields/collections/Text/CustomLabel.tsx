'use client'

import React from 'react'

const CustomLabel: React.FC<{ htmlFor: string }> = ({ htmlFor }) => {
  return (
    <label className="custom-label" htmlFor={htmlFor}>
      #label
    </label>
  )
}

export default CustomLabel
