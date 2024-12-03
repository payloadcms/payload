'use client'
import type { FieldDescriptionClientComponent } from 'payload'

import React from 'react'

export const FieldDescriptionComponent: FieldDescriptionClientComponent = ({ path }) => {
  return <div className={`field-description-${path}`}>Component description: {path}</div>
}
