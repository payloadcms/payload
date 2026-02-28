'use client'

import type { SidebarTabClientProps } from 'payload'

import React from 'react'

export const CustomTab: React.FC<{ content: string; heading: string } & SidebarTabClientProps> = ({
  content,
  heading,
}) => {
  return (
    <div>
      <h3>{heading}</h3>
      <p style={{ paddingTop: '10px' }}>{content}</p>
    </div>
  )
}
