import { createContext, use } from 'react'

import type { IFolderQueryParamsContext } from './types.js'

export const FolderQueryParamsContext = createContext({} as IFolderQueryParamsContext)

export const useFolderQueryParams = (): IFolderQueryParamsContext => use(FolderQueryParamsContext)

export const FolderQueryParamsModifiedContext = createContext(false)

export const useFolderQueryParamsModified = (): boolean => use(FolderQueryParamsModifiedContext)
