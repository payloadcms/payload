'use client'

import React, { createContext } from 'react'

type SelectedLocalesContextType = {
  selectedLocales: string[]
}

export const SelectedLocalesContext = createContext<SelectedLocalesContextType>({
  selectedLocales: [],
})

export const useSelectedLocales = () => React.useContext(SelectedLocalesContext)
