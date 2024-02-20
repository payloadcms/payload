'use client'
import React from 'react'

type FieldPathContextType = {
  path: string
  schemaPath: string
}
const FieldPathContext = React.createContext<FieldPathContextType>({
  path: '',
  schemaPath: '',
})

export const FieldPathProvider: React.FC<{
  path: string
  schemaPath: string
  children: React.ReactNode
}> = (props) => {
  const { children, path, schemaPath } = props

  return (
    <FieldPathContext.Provider
      value={{
        path,
        schemaPath,
      }}
    >
      {children}
    </FieldPathContext.Provider>
  )
}

export const useFieldPath = () => {
  const path = React.useContext(FieldPathContext)
  return path
}
