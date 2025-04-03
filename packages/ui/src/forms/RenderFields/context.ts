import React from 'react'

export const FieldPathContext = React.createContext<string>(undefined)

export const useFieldPath = () => {
  const context = React.useContext(FieldPathContext)

  if (!context) {
    throw new Error('useFieldPath must be used within a FieldPathProvider')
  }

  return context
}
