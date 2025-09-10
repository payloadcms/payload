import React from 'react'

export const FieldPathContext = React.createContext<string>(undefined)

export const useFieldPath = () => {
  const context = React.useContext(FieldPathContext)

  if (!context) {
    // swallow the error, not all fields are wrapped in a FieldPathContext
    return undefined
  }

  return context
}
