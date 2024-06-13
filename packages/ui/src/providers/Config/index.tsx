'use client'
import type { ClientConfig } from 'payload'

import React, { createContext, useContext } from 'react'

const Context = createContext<ClientConfig>({} as ClientConfig)

export const ConfigProvider: React.FC<{ children: React.ReactNode; config: ClientConfig }> = ({
  children,
  config,
}) => {
  return <Context.Provider value={config}>{children}</Context.Provider>
}

export const useConfig = (): ClientConfig => useContext(Context)
