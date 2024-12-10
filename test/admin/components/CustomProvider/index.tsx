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

  return (
    <Context.Provider value={value}>
      <div className="custom-provider" style={{ display: 'none' }}>
        This is a custom provider.
      </div>
      {children}
    </Context.Provider>
  )
}

export const useCustom = () => useContext(Context)
