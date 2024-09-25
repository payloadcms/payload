'use client'
import type { ClientCollectionConfig, FieldAffectingData, SanitizedCollectionConfig } from 'payload'

import React, { createContext, useContext } from 'react'

import type { Column } from '../../elements/Table/index.js'

import { useConfig } from '../Config/index.js'
// import { useServerActions } from '../ServerActions/index.js'
// import { useTranslation } from '../Translation/index.js'

export type ColumnPreferences = Pick<Column, 'accessor' | 'active'>[]

export type ListInfoProps = {
  readonly beforeActions?: React.ReactNode[]
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
  readonly collectionConfig?: ClientCollectionConfig
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
  const { collectionSlug } = props

  const { getEntityConfig } = useConfig()

  const collectionConfig = getEntityConfig({ collectionSlug }) as ClientCollectionConfig

  // const payloadServerAction = useServerActions()

  // const { i18n } = useTranslation()

  // useEffect(() => {
  //   // TODO: rewrite this to use the new pattern
  //   if (!collectionConfig) {
  //     const getNewConfig = async () => {
  //       // @ts-expect-error eslint-disable-next-line
  //       const res = (await payloadServerAction('render-config', {
  //         collectionSlug,
  //         languageCode: i18n.language,
  //       })) as any as ClientCollectionConfig
  //     }
  //     void getNewConfig()
  //   }
  // }, [payloadServerAction, collectionSlug, i18n.language, collectionConfig])

  return (
    <Context.Provider
      value={{
        ...props,
        collectionConfig,
      }}
    >
      {children}
    </Context.Provider>
  )
}
