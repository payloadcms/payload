'use client'

import type { OptionObject } from 'payload'

import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

type ContextType = {
  /**
   * Hoists the forms modified state
   */
  modified?: boolean
  /**
   * Array of options to select from
   */
  options: OptionObject[]
  /**
   * The currently selected tenant ID
   */
  selectedTenantID: number | string | undefined
  /**
   * Sets the modified state
   */
  setModified: React.Dispatch<React.SetStateAction<boolean>>
  /**
   * Sets the selected tenant ID
   *
   * @param args.id - The ID of the tenant to select
   * @param args.refresh - Whether to refresh the page after changing the tenant
   */
  setTenant: (args: { id: number | string | undefined; refresh?: boolean }) => void
  /**
   * Sets the view when a document is loaded
   */
  setView: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>
  /**
   *
   */
  updateTenants: (args: { id: number | string; label: string }) => void
  /**
   * The current view type, either 'document' or 'global'
   */
  view?: 'document' | 'global' | undefined
}

const Context = createContext<ContextType>({
  options: [],
  selectedTenantID: undefined,
  setModified: () => undefined,
  setTenant: () => null,
  setView: () => undefined,
  updateTenants: () => null,
  view: undefined,
})

export const TenantSelectionProviderClient = ({
  children,
  initialValue,
  tenantCookie,
  tenantOptions: tenantOptionsFromProps,
}: {
  children: React.ReactNode
  initialValue?: number | string
  tenantCookie?: string
  tenantOptions: OptionObject[]
}) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    initialValue,
  )
  const [modified, setModified] = React.useState<boolean>(false)
  const [view, setView] = React.useState<'document' | 'global' | undefined>(undefined)
  const { user } = useAuth()
  const userID = React.useMemo(() => user?.id, [user?.id])
  const [tenantOptions, setTenantOptions] = React.useState<OptionObject[]>(
    () => tenantOptionsFromProps,
  )
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
    // eslint-disable-next-line react-compiler/react-compiler -- TODO: fix
    document.cookie = 'payload-tenant=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  }, [])

  const setTenant = React.useCallback<ContextType['setTenant']>(
    ({ id, refresh }) => {
      if (id === undefined) {
        if (tenantOptions.length > 1) {
          // users with multiple tenants can clear the tenant selection
          setSelectedTenantID(undefined)
          deleteCookie()
        } else {
          // if there is only one tenant, force the selection of that tenant
          setSelectedTenantID(tenantOptions[0]?.value)
          setCookie(String(tenantOptions[0]?.value))
        }
      } else if (!tenantOptions.find((option) => option.value === id)) {
        // if the tenant is not valid, set the first tenant as selected
        if (tenantOptions?.[0]?.value) {
          setTenant({ id: tenantOptions[0].value, refresh: true })
        } else {
          setTenant({ id: undefined, refresh: true })
        }
      } else {
        // if the tenant is in the options, set it as selected
        setSelectedTenantID(id)
        setCookie(String(id))
      }
      if (view !== 'document' && refresh) {
        router.refresh()
      }
    },
    [deleteCookie, view, router, setCookie, tenantOptions],
  )

  const updateTenants = React.useCallback<ContextType['updateTenants']>(({ id, label }) => {
    setTenantOptions((prev) => {
      return prev.map((currentTenant) => {
        if (id === currentTenant.value) {
          return {
            label,
            value: id,
          }
        }
        return currentTenant
      })
    })
  }, [])

  React.useEffect(() => {
    if (userID && !tenantCookie) {
      if (tenantOptionsFromProps.length === 1) {
        // Users with no cookie set and only 1 tenant should set that tenant automatically
        setTenant({ id: tenantOptionsFromProps[0]?.value, refresh: true })
      }
      setTenantOptions(tenantOptionsFromProps)
    }
  }, [initialValue, selectedTenantID, tenantCookie, userID, setTenant, tenantOptionsFromProps])

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
          modified,
          options: tenantOptions,
          selectedTenantID,
          setModified,
          setTenant,
          setView,
          updateTenants,
          view,
        }}
      >
        {children}
      </Context>
    </span>
  )
}

export const useTenantSelection = () => React.use(Context)
