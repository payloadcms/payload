import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import { createContext, use, useEffect, useState } from 'react'

import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import { useConfig } from '../Config/index.js'
import { useDocumentInfo } from '../DocumentInfo/index.js'
import { useTranslation } from '../Translation/index.js'

type IDocumentTitleContext = {
  setDocumentTitle: (title: string) => void
  title: string
}

const DocumentTitleContext = createContext({} as IDocumentTitleContext)

export const useDocumentTitle = (): IDocumentTitleContext => use(DocumentTitleContext)

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

  const [title, setDocumentTitle] = useState(() =>
    formatDocTitle({
      collectionConfig: collectionSlug ? (docConfig as ClientCollectionConfig) : undefined,
      data: { ...(initialData || {}), id },
      dateFormat,
      fallback: id?.toString(),
      globalConfig: globalSlug ? (docConfig as ClientGlobalConfig) : undefined,
      i18n,
    }),
  )

  useEffect(() => {
    setDocumentTitle(
      formatDocTitle({
        collectionConfig: collectionSlug ? (docConfig as ClientCollectionConfig) : undefined,
        data: { ...data, id },
        dateFormat,
        fallback: id?.toString(),
        globalConfig: globalSlug ? (docConfig as ClientGlobalConfig) : undefined,
        i18n,
      }),
    )
  }, [data, dateFormat, i18n, id, collectionSlug, docConfig, globalSlug])

  return <DocumentTitleContext value={{ setDocumentTitle, title }}>{children}</DocumentTitleContext>
}
