'use client'

import type { OptionObject } from 'payload'

import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

type ContextType = {
  /**
   * Array of options to select from
   */
  options: OptionObject[]
  /**
   * The currently selected tenant ID
   */
  selectedTenantID: number | string | undefined
  /**
   * Prevents a refresh when the tenant is changed
   *
   * If not switching tenants while viewing a "global", set to true
   */
  setPreventRefreshOnChange: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * Sets the selected tenant ID
   *
   * @param args.id - The ID of the tenant to select
   * @param args.refresh - Whether to refresh the page after changing the tenant
   */
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
  tenantCookie,
  tenantOptions,
}: {
  children: React.ReactNode
  initialValue?: number | string
  tenantCookie?: string
  tenantOptions: OptionObject[]
}) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    initialValue,
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

  const deleteCookie = React.useCallback(() => {
    document.cookie = 'payload-tenant=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  }, [])

  const setTenant = React.useCallback<ContextType['setTenant']>(
    ({ id, refresh }) => {
      if (id === undefined) {
        if (tenantOptions.length > 1) {
          setSelectedTenantID(undefined)
          deleteCookie()
        } else {
          setSelectedTenantID(tenantOptions[0]?.value)
          setCookie(String(tenantOptions[0]?.value))
        }
      } else {
        setSelectedTenantID(id)
        setCookie(String(id))
      }
      if (!preventRefreshOnChange && refresh) {
        router.refresh()
      }
    },
    [deleteCookie, preventRefreshOnChange, router, setCookie, setSelectedTenantID, tenantOptions],
  )

  React.useEffect(() => {
    if (selectedTenantID && !tenantOptions.find((option) => option.value === selectedTenantID)) {
      if (tenantOptions?.[0]?.value) {
        setTenant({ id: tenantOptions[0].value, refresh: true })
      } else {
        setTenant({ id: undefined, refresh: true })
      }
    }
  }, [tenantCookie, setTenant, selectedTenantID, tenantOptions, initialValue, setCookie])

  React.useEffect(() => {
    if (userID && !tenantCookie) {
      // User is logged in, but does not have a tenant cookie, set it
      setSelectedTenantID(initialValue)
      if (initialValue) {
        setCookie(String(initialValue))
      } else {
        deleteCookie()
      }
    }
  }, [userID, tenantCookie, initialValue, setCookie, deleteCookie, router])

  React.useEffect(() => {
    if (!userID && tenantCookie) {
      // User is not logged in, but has a tenant cookie, delete it
      deleteCookie()
      setSelectedTenantID(undefined)
    } else if (userID) {
      // User changed, refresh
      router.refresh()
    }
  }, [userID, tenantCookie, deleteCookie, router])

  return (
    <span
      data-selected-tenant-id={selectedTenantID}
      data-selected-tenant-title={selectedTenantLabel}
    >
      <Context
        value={{
          options: tenantOptions,
          selectedTenantID,
          setPreventRefreshOnChange,
          setTenant,
        }}
      >
        {children}
      </Context>
    </span>
  )
}

export const useTenantSelection = () => React.use(Context)
