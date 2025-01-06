import type { ArrayField, RelationshipField, User } from 'payload'

export type MultiTenantPluginConfig = {
  collections: {
    [collectionSlug: string]: {
      /**
       * Set to `false` if you want to manually place the tenant field in a collection
       *
       * @default true
       */
      includeTenantField?: boolean
      /**
       * Set to `false` if you want to manually apply the baseListFilter
       *
       * @default true
       */
      useBaseListFilter?: boolean
      /**
       * Set to `false` if you want to handle collection access manually without the multi-tenant constraints applied
       *
       * @default true
       */
      useTenantAccess?: boolean
    }
  }
  /**
   * Field configuration for the field added to all tenant enabled collections
   */
  documentTenantField: {
    access: RelationshipField['access']
    /**
     * The name of the field added to all tenant enabled collections
     *
     * @default 'tenant'
     */
    name?: string
  }
  /**
   * Enables the multi-tenant plugin
   *
   * @default true
   */
  enabled?: boolean
  /**
   * The slug for the tenant collection
   *
   * @default 'tenants'
   */
  tenantsSlug?: string
  /**
   * Function that determines if a user has access to _all_ tenants
   *
   * Useful for super-admin type users
   */
  userHasAccessToAllTenants?: (user: User) => boolean
  /**
   * Field configuration for the field added to the users collection
   */
  userTenantsField: {
    access: ArrayField['access']
    defaultRole: string
    roles: string[]
  }
}

export type Tenant<IDType = number | string> = {
  id: IDType
  name: string
}

export type UserWithTenantsField = {
  tenants: {
    roles: string[]
    tenant: number | string | Tenant
  }[]
} & User
