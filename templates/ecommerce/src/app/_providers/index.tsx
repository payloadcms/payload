'use client'

import React from 'react'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'

import { AuthProvider } from '../_providers/Auth'
import { CartProvider } from '../_providers/Cart'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <ModalProvider transTime={0} zIndex="var(--modal-z-index)">
          {children}
          <ModalContainer />
        </ModalProvider>
      </CartProvider>
    </AuthProvider>
  )
}
