'use client'
import React from 'react'

type ElementContextType = {
  path: string
  schemaPath: string
}

const ElementContext = React.createContext<ElementContextType>({
  path: '',
  schemaPath: '',
})

export const ElementProvider: React.FC<{
  children: React.ReactNode
  path: string
  schemaPath: string
}> = (props) => {
  const { children, ...rest } = props

  return (
    <ElementContext.Provider
      value={{
        ...rest,
      }}
    >
      {children}
    </ElementContext.Provider>
  )
}

export const useElement = () => {
  const path = React.useContext(ElementContext)
  return path
}
