'use client'

import type { OptionObject } from 'payload'

import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

import { SELECT_ALL } from '../../constants.js'

type ContextType = {
  options: OptionObject[]
  selectedTenantID: number | string | undefined
  setPreventRefreshOnChange: React.Dispatch<React.SetStateAction<boolean>>
  setTenant: (args: { id: number | string | undefined; refresh?: boolean }) => void
}

const Context = createContext<ContextType>({
  options: [],
  selectedTenantID: undefined,
  setPreventRefreshOnChange: () => null,
  setTenant: () => null,
})

export const TenantSelectionProviderClient = ({
  children,
  initialValue,
  tenantOptions,
}: {
  children: React.ReactNode
  initialValue?: string
  tenantOptions: OptionObject[]
}) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string>(
    initialValue || SELECT_ALL,
  )
  const [preventRefreshOnChange, setPreventRefreshOnChange] = React.useState(false)
  const { user } = useAuth()
  const userID = React.useMemo(() => user?.id, [user?.id])
  const selectedTenantLabel = React.useMemo(
    () => tenantOptions.find((option) => option.value === selectedTenantID)?.label,
    [selectedTenantID, tenantOptions],
  )

  const router = useRouter()

  const setCookie = React.useCallback((value?: string) => {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = 'payload-tenant=' + (value || '') + expires + '; path=/'
  }, [])

  const setTenant = React.useCallback<ContextType['setTenant']>(
    ({ id, refresh }) => {
      if (id === undefined) {
        setSelectedTenantID(SELECT_ALL)
        setCookie(SELECT_ALL)
      } else {
        setSelectedTenantID(id)
        setCookie(String(id))
      }
      if (!preventRefreshOnChange && refresh) {
        router.refresh()
      }
    },
    [setSelectedTenantID, setCookie, router, preventRefreshOnChange],
  )

  React.useEffect(() => {
    if (
      selectedTenantID &&
      selectedTenantID !== SELECT_ALL &&
      !tenantOptions.find((option) => option.value === selectedTenantID)
    ) {
      if (tenantOptions?.[0]?.value) {
        setTenant({ id: tenantOptions[0].value, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    }
  }, [initialValue, setTenant, selectedTenantID, tenantOptions])

  React.useEffect(() => {
    router.refresh()
  }, [userID, router])

  return (
    <span
      data-selected-tenant-id={selectedTenantID}
      data-selected-tenant-title={selectedTenantLabel}
    >
      <Context.Provider
        value={{
          options: tenantOptions,
          selectedTenantID,
          setPreventRefreshOnChange,
          setTenant,
        }}
      >
        {children}
      </Context.Provider>
    </span>
  )
}

export const useTenantSelection = () => React.useContext(Context)
