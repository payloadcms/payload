import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import { createContext, use, useEffect, useState } from 'react'

import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import { useConfig } from '../Config/index.js'
import { useDocumentInfo } from '../DocumentInfo/index.js'
import { useTranslation } from '../Translation/index.js'

export type DocumentTitleContext = {
  setDocumentTitle: (title: string) => void
  title: string
}

const Context = createContext({} as DocumentTitleContext)

export const useDocumentTitle = (): DocumentTitleContext => use(Context)

function resolveDocTitle({
  collectionConfig,
  data,
  dateFormat,
  fallback,
  globalConfig,
  i18n,
}: {
  collectionConfig?: ClientCollectionConfig
  data: Record<string, unknown>
  dateFormat: string
  fallback?: string
  globalConfig?: ClientGlobalConfig
  i18n: ReturnType<typeof useTranslation>['i18n']
}): string {
  const hierarchyConfig =
    collectionConfig?.hierarchy && typeof collectionConfig.hierarchy === 'object'
      ? collectionConfig.hierarchy
      : undefined

  if (hierarchyConfig?.admin?.usePathAsTitle && hierarchyConfig.titlePathFieldName) {
    const pathTitle = data[hierarchyConfig.titlePathFieldName]
    if (typeof pathTitle === 'string' && pathTitle) {
      return pathTitle
    }
  }

  return formatDocTitle({
    collectionConfig,
    data,
    dateFormat,
    fallback,
    globalConfig,
    i18n,
  })
}

export const DocumentTitleProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { id, collectionSlug, data, docConfig, globalSlug, initialData } = useDocumentInfo()

  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  const collectionConfig = collectionSlug ? (docConfig as ClientCollectionConfig) : undefined
  const globalConfig = globalSlug ? (docConfig as ClientGlobalConfig) : undefined

  const [title, setDocumentTitle] = useState(() =>
    resolveDocTitle({
      collectionConfig,
      data: { ...(initialData || {}), id },
      dateFormat,
      fallback: id?.toString(),
      globalConfig,
      i18n,
    }),
  )

  useEffect(() => {
    setDocumentTitle(
      resolveDocTitle({
        collectionConfig,
        data: { ...data, id },
        dateFormat,
        fallback: id?.toString(),
        globalConfig,
        i18n,
      }),
    )
  }, [
    data,
    dateFormat,
    i18n,
    id,
    collectionSlug,
    docConfig,
    globalSlug,
    collectionConfig,
    globalConfig,
  ])

  return <Context value={{ setDocumentTitle, title }}>{children}</Context>
}
