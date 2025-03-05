'use client'
import React from 'react'

import { useWrapperBlockComponentContext } from '../BlockEditor/index.js'

export const WrapperBlockContainer = ({ children }: { children: React.ReactNode }) => {
  const { WrapperBlockContainer } = useWrapperBlockComponentContext()

  return WrapperBlockContainer ? <WrapperBlockContainer>{children}</WrapperBlockContainer> : null
}
