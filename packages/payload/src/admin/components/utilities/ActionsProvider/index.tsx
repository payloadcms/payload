import React, { createContext, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../globals/config/types'

import { useConfig } from '../../utilities/Config'

type DocumentInfo = {
  collection?: SanitizedCollectionConfig | null
  global?: SanitizedGlobalConfig | null
  id?: null | number | string
}
type ActionsContextType = {
  actions: React.ComponentType<any>[]
  documentInfo: DocumentInfo
  setDocumentInfo: (data: DocumentInfo) => void
  setViewActions: (actions: React.ComponentType<any>[]) => void
}

const defaultDocumentInfo: DocumentInfo = {
  id: null,
  collection: null,
  global: null,
}

const ActionsContext = createContext<ActionsContextType>({
  actions: [],
  documentInfo: defaultDocumentInfo,
  setDocumentInfo: () => {},
  setViewActions: () => {},
})

export const useActions = () => useContext(ActionsContext)

export const ActionsProvider = ({ children }) => {
  const [viewActions, setViewActions] = useState([])
  const [adminActions, setAdminActions] = useState([])
  const { id: idFromParams } = useParams<{ id: string }>()

  const [documentInfo, setDocumentInfo] = useState<DocumentInfo>(() => {
    return {
      id: idFromParams,
      collection: null,
      global: null,
    }
  })

  const {
    admin: {
      components: { actions: configAdminActions },
    },
  } = useConfig()

  useEffect(() => {
    setAdminActions(configAdminActions || [])
  }, [configAdminActions])

  const combinedActions = [...viewActions, ...adminActions]

  return (
    <ActionsContext.Provider
      value={{ actions: combinedActions, documentInfo, setDocumentInfo, setViewActions }}
    >
      {children}
    </ActionsContext.Provider>
  )
}
