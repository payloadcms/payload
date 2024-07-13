'use client'
import type { ClientConfig, FieldAffectingData, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useContext } from 'react'

import type { Column } from '../../elements/Table/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  Header?: React.ReactNode
  collectionConfig: ClientConfig['collections'][0]
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
  titleField?: FieldAffectingData
}

export type ListInfoContext = {
  Header?: React.ReactNode
  collectionSlug: string
  hasCreatePermission: boolean
  newDocumentURL: string
}

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

export const ListInfoProvider: React.FC<
  {
    children: React.ReactNode
  } & ListInfoProps
> = ({ children, ...props }) => {
  return <Context.Provider value={props}>{children}</Context.Provider>
}
