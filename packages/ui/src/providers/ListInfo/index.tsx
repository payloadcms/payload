'use client'
import React, { createContext, useContext } from 'react'

import type { ListInfoContext, ListInfoProps } from './types.js'

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

export const ListInfoProvider: React.FC<
  ListInfoProps & {
    children: React.ReactNode
  }
> = ({
  children,
  collectionSlug,
  hasCreatePermission,
  listSearchableFields,
  newDocumentURL,
  titleField,
}) => {
  return (
    <Context.Provider
      value={{
        collectionSlug,
        hasCreatePermission,
        listSearchableFields,
        newDocumentURL,
        titleField,
      }}
    >
      {children}
    </Context.Provider>
  )
}
