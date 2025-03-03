'use client'
import React, { createContext, useContext } from 'react'

export const ProductVariantsContext = createContext(false)

export const ProductVariantsProvider: React.FC<{
  children?: React.ReactNode
  withinGroup?: boolean
}> = ({ children, withinGroup = true }) => {
  return (
    <ProductVariantsContext.Provider value={withinGroup}>
      {children}
    </ProductVariantsContext.Provider>
  )
}

export const useGroup = (): boolean => useContext(ProductVariantsContext)
