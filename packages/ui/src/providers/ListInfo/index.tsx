'use client'
import type { ClientConfig, FieldAffectingData, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useContext } from 'react'

import type { Column } from '../../elements/Table/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  readonly Header?: React.ReactNode
  readonly collectionConfig: ClientConfig['collections'][0]
  readonly collectionSlug: SanitizedCollectionConfig['slug']
  readonly hasCreatePermission: boolean
  readonly newDocumentURL: string
  readonly titleField?: FieldAffectingData
}

export type ListInfoContext = {
  readonly Header?: React.ReactNode
  readonly collectionSlug: string
  readonly hasCreatePermission: boolean
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
