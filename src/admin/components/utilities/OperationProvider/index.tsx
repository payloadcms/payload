import { useContext, createContext } from 'react';

export const OperationContext = createContext(undefined);

export type Operation = 'create' | 'update'

export const useOperation = (): Operation | undefined => useContext(OperationContext);
