import { useContext, createContext } from 'react';

export const EditDepthContext = createContext(0);

export const useEditDepth = (): number => useContext(EditDepthContext);
