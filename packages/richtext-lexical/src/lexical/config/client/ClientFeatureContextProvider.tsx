'use client'

import * as React from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { LexicalRichTextFieldProps } from '../../../types.js'

export interface ClientFeatureContextType {
  field: LexicalRichTextFieldProps['field']
}

const Context: React.Context<ClientFeatureContextType> = createContext({
  editorConfig: null,
  field: null,
  uuid: null,
})

export const ClientFeatureContextProvider = ({
  children,
  field,
}: {
  children: React.ReactNode
  field: LexicalRichTextFieldProps['field']
}): React.ReactNode => {
  const clientFeatureContext = useMemo(
    () =>
      ({
        field,
      }) as ClientFeatureContextType,
    [field],
  )

  return <Context.Provider value={clientFeatureContext}>{children}</Context.Provider>
}

/**
 * This hook is used to provide client-side information to the ClientFeature provider interface.
 * It is wrapped around the ClientFeature component in its loading phase.
 */
export const useClientFeatureContext = (): ClientFeatureContextType => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useClientFeatureContext must be used within an ClientFeatureContextProvider')
  }
  return context
}
