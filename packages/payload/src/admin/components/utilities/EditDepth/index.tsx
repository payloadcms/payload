import { createContext, useContext } from 'react'

export const EditDepthContext = createContext(0)

export const useEditDepth = (): number => useContext(EditDepthContext)
