import React, { createContext, useContext, useState } from 'react'

type CustomContext = {
  getCustom
  setCustom
}

const Context = createContext({} as CustomContext)

const CustomProvider = ({ children }) => {
  const [getCustom, setCustom] = useState({})

  const value = {
    getCustom,
    setCustom,
  }

  console.log('custom provider called')

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export default CustomProvider

export const useCustom = () => useContext(Context)
