'use client'

import React, { createContext, use, useId } from 'react'

type TableIdentity = {
  baseID: string
  legacyBaseID: string
  navigationLabel?: string
}

export const TableGridContext = createContext(false)

const TableIdentityContext = createContext<null | TableIdentity>(null)

export const TableIdentityProvider: React.FC<{
  children: React.ReactNode
  collectionSlug: string
  navigationLabel?: string
}> = ({ children, collectionSlug, navigationLabel }) => {
  const instanceID = useId().replace(/:/g, '')

  return (
    <TableIdentityContext
      value={{
        baseID: `payload-table-${collectionSlug}-${instanceID}`,
        legacyBaseID: `payload-table-${collectionSlug}`,
        navigationLabel,
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

export const useTableNavigationLabel = (): string | undefined =>
  use(TableIdentityContext)?.navigationLabel
