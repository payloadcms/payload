'use client'
import type { FieldDescriptionClientProps } from 'payload'

import React from 'react'

export const FieldDescriptionComponent: React.FC<FieldDescriptionClientProps> = ({ path }) => {
  return <div className={`field-description-${path}`}>Component description: {path}</div>
}
