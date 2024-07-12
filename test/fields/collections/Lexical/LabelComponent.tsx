'use client'

import React from 'react'

export const LabelComponent: React.FC<{ formData: any }> = (props) => {
  const { formData } = props
  return <div>{formData?.key}</div>
}
