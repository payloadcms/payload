'use client'
import React, { createContext, useContext } from 'react'

import type { ClientConfig } from 'payload/types'

const Context = createContext<ClientConfig>({} as ClientConfig)

export const ConfigProvider: React.FC<{ children: React.ReactNode; config: ClientConfig }> = ({
  children,
  config,
}) => {
  return <Context.Provider value={config}>{children}</Context.Provider>
}

export const useConfig = (): ClientConfig => useContext(Context)
