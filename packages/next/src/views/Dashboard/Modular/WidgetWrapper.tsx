'use client'
import { XIcon } from '@payloadcms/ui'
import React from 'react'

import './WidgetWrapper.scss'

interface WidgetWrapperProps {
  children: React.ReactNode
  isEditing: boolean
  onDelete: () => void
  widgetId: string
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  children,
  isEditing,
  onDelete,
  widgetId,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  return (
    <div className={`widget-wrapper ${isEditing ? 'widget-wrapper--editing' : ''}`}>
      {children}
      {isEditing && (
        <button
          className="widget-wrapper__delete-btn"
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          title={`Delete widget ${widgetId}`}
          type="button"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}
