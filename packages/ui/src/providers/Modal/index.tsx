'use client'

import type { ComponentProps } from 'react'

import { ModalProvider as FacelessModalProvider } from '@faceless-ui/modal'
import React from 'react'

import { ModalAccessibility } from '../ModalAccessibility/index.js'
import { ModalFocusProvider } from '../ModalFocus/index.js'

export { ModalContainer } from '@faceless-ui/modal'

export type ModalProviderProps = ComponentProps<typeof FacelessModalProvider>

/** Provides shared modal state, background isolation, and focus restoration. */
export function ModalProvider({
  children,
  classPrefix = 'payload',
  transTime = 0,
  zIndex = 'var(--z-modal)',
  ...props
}: ModalProviderProps) {
  return (
    <FacelessModalProvider
      {...props}
      classPrefix={classPrefix}
      transTime={transTime}
      zIndex={zIndex}
    >
      <ModalFocusProvider>
        <ModalAccessibility />
        {children}
      </ModalFocusProvider>
    </FacelessModalProvider>
  )
}
