'use client'
import React from 'react'

export const CustomTab: React.FC<{ content: string; heading: string }> = ({ content, heading }) => {
  return (
    <div>
      <h3>{heading}</h3>
      <p style={{ paddingTop: '10px' }}>{content}</p>
    </div>
  )
}
