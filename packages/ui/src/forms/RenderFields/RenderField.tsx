'use client'
import React from 'react'
import { FieldPathProvider, useFieldPath } from '../FieldPathProvider'

export const RenderField: React.FC<{
  name?: string
  Field: React.ReactNode
}> = (props) => {
  const { name, Field } = props
  const pathFromContext = useFieldPath()
  const path = `${pathFromContext ? `${pathFromContext}.` : ''}${name || ''}`
  return <FieldPathProvider path={path}>{Field}</FieldPathProvider>
}
