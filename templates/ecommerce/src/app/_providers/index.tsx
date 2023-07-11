'use client'

import React from 'react'
import { GridProvider } from '@faceless-ui/css-grid'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'

import { AuthProvider } from '../_providers/Auth'
import { CartProvider } from '../_providers/Cart'
import cssVariables from '../cssVariables'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        <GridProvider
          breakpoints={{
            s: cssVariables.breakpoints.s,
            m: cssVariables.breakpoints.m,
            l: cssVariables.breakpoints.l,
          }}
          colGap={{
            s: '24px',
            m: '48px',
            l: '48px',
            xl: '72px',
          }}
          cols={{
            s: 4,
            m: 4,
            l: 12,
            xl: 12,
          }}
        >
          <ModalProvider transTime={0} zIndex="var(--modal-z-index)">
            {children}
            <ModalContainer />
          </ModalProvider>
        </GridProvider>
      </CartProvider>
    </AuthProvider>
  )
}
