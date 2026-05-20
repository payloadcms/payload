'use client'

import type { ImportMap } from 'payload'

import { createContext, use } from 'react'

const ImportMapContext = createContext<ImportMap | null>(null)

export const ImportMapProvider = ImportMapContext.Provider

export const useImportMap = (): ImportMap | null => use(ImportMapContext)
