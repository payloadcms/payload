'use client'

import React from 'react'
import { ModalContainer, ModalProvider } from '@faceless-ui/modal'
import { CloseModalOnRouteChange } from '../_components/CloseModalOnRouteChange'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (

    <ModalProvider
      classPrefix="form"
      transTime={0}
      zIndex="var(--modal-z-index)"
    >
      <CloseModalOnRouteChange />
      {children}
      <ModalContainer />

    </ModalProvider>

  )
}
