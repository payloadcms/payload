'use client'

import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

import { SELECT_ALL } from '../../constants.js'

type ContextType = {
  options: { label: string; value: string }[]
  selectedTenantID: number | string | undefined
  setOptions?: (options: { label: string; value: string }[]) => void
  setRefreshOnChange?: (refresh: boolean) => void
  setTenant: (args: { from: 'cookie' | 'document'; id: number | string; refresh?: boolean }) => void
}

const Context = createContext<ContextType>({
  options: [],
  selectedTenantID: undefined,
  setOptions: () => null,
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
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([])

  const router = useRouter()

  const setCookie = React.useCallback((value?: string) => {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = 'payload-tenant=' + (value || '') + expires + '; path=/'
  }, [])

  const setTenant = React.useCallback<ContextType['setTenant']>(
    ({ id, from, refresh }) => {
      if (from === 'cookie' && tenantSelectionFrom === 'document') {
        return
      }
      setTenantSelectionFrom(from)
      if (id) {
        setSelectedTenantID(id)
        setCookie(String(id))
      } else {
        setSelectedTenantID(SELECT_ALL)
        setCookie(SELECT_ALL)
      }
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
    <Context.Provider
      value={{ options, selectedTenantID, setOptions, setRefreshOnChange, setTenant }}
    >
      {children}
    </Context.Provider>
  )
}

export const useTenantSelection = () => React.useContext(Context)
