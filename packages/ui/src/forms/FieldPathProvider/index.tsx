'use client'
import React from 'react'

const FieldPathContext = React.createContext<string>('')

export const FieldPathProvider: React.FC<{
  path: string
  children: React.ReactNode
}> = (props) => {
  const { children, path } = props

  return <FieldPathContext.Provider value={path}>{children}</FieldPathContext.Provider>
}

export const useFieldPath = () => {
  const path = React.useContext(FieldPathContext)
  return path
}
