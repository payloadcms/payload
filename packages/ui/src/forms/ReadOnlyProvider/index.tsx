'use client'
import React from 'react'

const ReadOnlyContext = React.createContext<boolean | undefined>(undefined)

export const ReadOnlyProvider: React.FC<{
  children: React.ReactNode
  readOnly?: boolean
}> = (props) => {
  const { children, readOnly } = props

  return <ReadOnlyContext.Provider value={readOnly}>{children}</ReadOnlyContext.Provider>
}

export const useReadOnly = () => {
  const path = React.useContext(ReadOnlyContext)
  return path
}
