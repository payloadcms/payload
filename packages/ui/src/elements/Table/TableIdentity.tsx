'use client'

import React, { createContext, use, useId } from 'react'

type TableIdentity = {
  baseID: string
  legacyBaseID: string
}

const TableIdentityContext = createContext<null | TableIdentity>(null)

export const TableIdentityProvider: React.FC<{
  children: React.ReactNode
  collectionSlug: string
}> = ({ children, collectionSlug }) => {
  const instanceID = useId().replace(/:/g, '')

  return (
    <TableIdentityContext
      value={{
        baseID: `payload-table-${collectionSlug}-${instanceID}`,
        legacyBaseID: `payload-table-${collectionSlug}`,
      }}
    >
      {children}
    </TableIdentityContext>
  )
}

export const useTableID = (id?: string): string | undefined => {
  const identity = use(TableIdentityContext)

  if (!identity || !id) {
    return id
  }

  if (id === identity.legacyBaseID) {
    return identity.baseID
  }

  if (id.startsWith(`${identity.legacyBaseID}-`)) {
    return `${identity.baseID}${id.slice(identity.legacyBaseID.length)}`
  }

  return id
}
