'use client'

import type { OptionObject } from 'payload'

import { toast, useAuth, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'
import React, { createContext } from 'react'

type ContextType = {
  /**
   * What is the context of the selector? It is either 'document' | 'global' | undefined.
   *
   * - 'document' means you are viewing a document in the context of a tenant
   * - 'global' means you are viewing a "global" (globals are collection documents but prevent you from viewing the list view) document in the context of a tenant
   * - undefined means you are not viewing a document at all
   */
  entityType?: 'document' | 'global'
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
   * Sets the entityType when a document is loaded and sets it to undefined when the document unmounts.
   */
  setEntityType: React.Dispatch<React.SetStateAction<'document' | 'global' | undefined>>
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
   * Used to sync tenants displayed in the tenant selector when updates are made to the tenants collection.
   */
  syncTenants: () => Promise<void>
  /**
   *
   */
  updateTenants: (args: { id: number | string; label: string }) => void
}

const Context = createContext<ContextType>({
  entityType: undefined,
  options: [],
  selectedTenantID: undefined,
  setEntityType: () => undefined,
  setModified: () => undefined,
  setTenant: () => null,
  syncTenants: () => Promise.resolve(),
  updateTenants: () => null,
})

export const TenantSelectionProviderClient = ({
  children,
  initialValue,
  tenantCookie,
  tenantOptions: tenantOptionsFromProps,
  tenantsCollectionSlug,
  useAsTitle,
}: {
  children: React.ReactNode
  initialValue?: number | string
  tenantCookie?: string
  tenantOptions: OptionObject[]
  tenantsCollectionSlug: string
  useAsTitle: string
}) => {
  const [selectedTenantID, setSelectedTenantID] = React.useState<number | string | undefined>(
    initialValue,
  )
  const [modified, setModified] = React.useState<boolean>(false)
  const [entityType, setEntityType] = React.useState<'document' | 'global' | undefined>(undefined)
  const { user } = useAuth()
  const { config } = useConfig()
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
      if (entityType !== 'document' && refresh) {
        router.refresh()
      }
    },
    [deleteCookie, entityType, router, setCookie, tenantOptions],
  )

  const syncTenants = React.useCallback(async () => {
    try {
      const req = await fetch(
        `${config.serverURL}${config.routes.api}/${tenantsCollectionSlug}?select[${useAsTitle}]=true&limit=0&depth=0`,
        {
          credentials: 'include',
          method: 'GET',
        },
      )

      const result = await req.json()

      if (result.docs) {
        setTenantOptions(
          result.docs.map((doc: Record<string, number | string>) => ({
            label: doc[useAsTitle],
            value: doc.id,
          })),
        )
      }
    } catch (e) {
      toast.error(`Error fetching tenants`)
    }
  }, [config.serverURL, config.routes.api, tenantsCollectionSlug, useAsTitle])

  const updateTenants = React.useCallback<ContextType['updateTenants']>(
    ({ id, label }) => {
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

      void syncTenants()
    },
    [syncTenants],
  )

  React.useEffect(() => {
    if (userID && !tenantCookie) {
      if (tenantOptionsFromProps.length === 1) {
        // Users with no cookie set and only 1 tenant should set that tenant automatically
        setTenant({ id: tenantOptionsFromProps[0]?.value, refresh: true })
        setTenantOptions(tenantOptionsFromProps)
      } else if ((!tenantOptions || tenantOptions.length === 0) && tenantOptionsFromProps) {
        // If there are no tenant options, set them from the props
        setTenantOptions(tenantOptionsFromProps)
      }
    }
  }, [
    initialValue,
    selectedTenantID,
    tenantCookie,
    userID,
    setTenant,
    tenantOptionsFromProps,
    tenantOptions,
  ])

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
          entityType,
          modified,
          options: tenantOptions,
          selectedTenantID,
          setEntityType,
          setModified,
          setTenant,
          syncTenants,
          updateTenants,
        }}
      >
        {children}
      </Context>
    </span>
  )
}

export const useTenantSelection = () => React.use(Context)
