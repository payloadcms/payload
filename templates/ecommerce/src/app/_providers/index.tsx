'use client'

import React from 'react'

import { AuthProvider } from '../_providers/Auth'
import { CartProvider } from '../_providers/Cart'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  )
}
