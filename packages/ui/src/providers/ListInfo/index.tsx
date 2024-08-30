'use client'
import type { ClientConfig, FieldAffectingData, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useContext } from 'react'

import type { Column } from '../../elements/Table/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  readonly beforeActions?: React.ReactNode[]
  readonly collectionConfig: ClientConfig['collections'][0]
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly disableBulkDelete?: boolean
  readonly disableBulkEdit?: boolean
  readonly hasCreatePermission: boolean
  readonly Header?: React.ReactNode
  readonly newDocumentURL: string
  readonly titleField?: FieldAffectingData
}

export type ListInfoContext = {
  readonly beforeActions?: React.ReactNode[]
  readonly collectionSlug: string
  readonly disableBulkDelete?: boolean
  readonly disableBulkEdit?: boolean
  readonly hasCreatePermission: boolean
  readonly Header?: React.ReactNode
  readonly newDocumentURL: string
} & ListInfoProps

const Context = createContext({} as ListInfoContext)

export const useListInfo = (): ListInfoContext => useContext(Context)

export const ListInfoProvider: React.FC<
  {
    readonly children: React.ReactNode
  } & ListInfoProps
> = ({ children, ...props }) => {
  return <Context.Provider value={props}>{children}</Context.Provider>
}
