'use client'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'

import './index.css'

const baseClass = 'toolbar-area'

export const ToolbarArea: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { setNodeRef } = useDroppable({
    id: 'live-preview-area',
  })

  return (
    <div className={baseClass} ref={setNodeRef}>
      {children}
    </div>
  )
}
