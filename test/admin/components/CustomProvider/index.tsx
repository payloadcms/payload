'use client'

import React, { createContext, useContext, useState } from 'react'

type CustomContext = {
  getCustom
  setCustom
}

const Context = createContext({} as CustomContext)

export const CustomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [getCustom, setCustom] = useState({})

  const value = {
    getCustom,
    setCustom,
  }

  console.log('custom provider called')

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useCustom = () => useContext(Context)
