'use client'

import { createContext, use } from 'react'

type SelectedLocalesContextType = {
  selectedLocales: string[]
}

export const SelectedLocalesContext = createContext<SelectedLocalesContextType>({
  selectedLocales: [],
})

export const useSelectedLocales = () => use(SelectedLocalesContext)
