import type { ClientCollectionConfig, ClientGlobalConfig } from 'payload'

import { createContext, use, useState } from 'react'

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
  const { id, docConfig, initialData } = useDocumentInfo()

  const {
    config: {
      admin: { dateFormat },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  const [title, setDocumentTitle] = useState(() =>
    formatDocTitle({
      collectionConfig: docConfig as ClientCollectionConfig,
      data: { ...(initialData || {}), id },
      dateFormat,
      fallback: id?.toString(),
      globalConfig: docConfig as ClientGlobalConfig,
      i18n,
    }),
  )

  return <DocumentTitleContext value={{ setDocumentTitle, title }}>{children}</DocumentTitleContext>
}
