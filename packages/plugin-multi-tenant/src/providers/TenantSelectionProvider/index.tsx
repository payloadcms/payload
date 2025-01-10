'use client'

import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

type ContextType = {
  selectedTenantID: number | string | undefined
  setRefreshOnChange?: (refresh: boolean) => void
  setTenant: (id: number | string, from: 'cookie' | 'document', refresh?: boolean) => void
}

const Context = createContext<ContextType>({
  selectedTenantID: undefined,
  setRefreshOnChange: () => null,
  setTenant: () => null,
})

export const TenantSelectionProvider = ({ children }) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    undefined,
  )
  const [tenantSelectionFrom, setTenantSelectionFrom] = React.useState<'cookie' | 'document'>(
    undefined,
  )
  const [refreshOnChange, setRefreshOnChange] = React.useState<boolean>(true)

  const router = useRouter()

  const setCookie = React.useCallback((value?: string) => {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = 'payload-tenant=' + (value || '') + expires + '; path=/'
  }, [])

  const setTenant = React.useCallback(
    (id: number | string, from: 'cookie' | 'document', refresh = false) => {
      if (from === 'cookie' && tenantSelectionFrom === 'document') {
        return
      }
      setSelectedTenantID(id)
      setTenantSelectionFrom(from)
      setCookie(String(id))
      if (refresh && refreshOnChange) {
        router.refresh()
      }
    },
    [
      tenantSelectionFrom,
      setSelectedTenantID,
      setTenantSelectionFrom,
      setCookie,
      router,
      refreshOnChange,
    ],
  )

  return (
    <Context.Provider value={{ selectedTenantID, setRefreshOnChange, setTenant }}>
      {children}
    </Context.Provider>
  )
}

export const useTenantSelection = () => React.useContext(Context)
