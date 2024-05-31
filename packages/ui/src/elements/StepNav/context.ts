import { createContext, useContext } from 'react'

import type { ContextType } from './types.js'

export const useStepNav = (): ContextType => useContext(Context)

export const Context = createContext({} as ContextType)
