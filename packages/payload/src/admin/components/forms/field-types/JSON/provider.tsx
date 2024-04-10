import React, { createContext, useContext, useState } from 'react'

const Context = createContext({})

export const JSONProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [schemas, setSchemas] = useState([])
  const value = { schemas, setSchemas }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useJSONSchemaContext = () => {
  const schemaContext = useContext(Context)
  if (schemaContext === undefined) return 'no context'

  return schemaContext
}

export default Context
