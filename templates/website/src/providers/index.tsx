'use client'

import React from 'react'
import { GridProvider } from '@faceless-ui/css-grid'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'

import cssVariables from '../cssVariables'

// import { AuthProvider } from './Auth'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    // <AuthProvider>
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
    // </AuthProvider>
  )
}
