import { useDroppable } from '@dnd-kit/core'
import React from 'react'

export const Droppable: React.FC<{
  children: React.ReactNode
}> = (props) => {
  const { children } = props

  const { setNodeRef } = useDroppable({
    id: 'live-preview-area',
  })

  return (
    <div ref={setNodeRef} style={{ height: '100%' }}>
      {children}
    </div>
  )
}
