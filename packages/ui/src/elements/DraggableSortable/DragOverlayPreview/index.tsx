'use client'

import React from 'react'

import { Collapsible } from '../../Collapsible/index.js'
import './index.css'

const baseClass = 'drag-overlay-preview'

export const DragOverlayPreview: React.FC<{ header: React.ReactNode }> = ({ header }) => {
  return (
    <div className={baseClass}>
      <Collapsible
        collapsibleStyle="default"
        dragHandleProps={{ id: '', attributes: {}, listeners: undefined }}
        header={header}
        isCollapsed
      >
        <></>
      </Collapsible>
    </div>
  )
}
