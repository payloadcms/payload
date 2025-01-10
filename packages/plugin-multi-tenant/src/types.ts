import type { ArrayField, CollectionSlug, Field, RelationshipField, User } from 'payload'

export type MultiTenantPluginConfig<ConfigTypes = unknown> = {
  collections: {
    [key in CollectionSlug]?: {
      /**
       * Set to `true` if you want the collection to behave as a global
       *
       * @default false
       */
      isGlobal?: boolean
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
   * Enables debug mode
   * - Makes the tenant field visible in the admin UI within applicable collections
   *
   * @default false
   */
  debug?: boolean
  /**
   * Enables the multi-tenant plugin
   *
   * @default true
   */
  enabled?: boolean
  /**
   * Field configuration for the field added to all tenant enabled collections
   */
  tenantField?: {
    access?: RelationshipField['access']
    /**
     * The name of the field added to all tenant enabled collections
     *
     * @default 'tenant'
     */
    name?: string
  }
  /**
   * Field configuration for the field added to the users collection
   *
   * If `includeDefaultField` is `false`, you must include the field on your users collection manually
   * This is useful if you want to customize the field or place the field in a specific location
   */
  tenantsArrayField?:
    | {
        arrayFieldAccess?: ArrayField['access']
        includeDefaultField?: true
        rowFields?: Field[]
        tenantFieldAccess?: RelationshipField['access']
      }
    | {
        arrayFieldAccess?: never
        includeDefaultField?: false
        rowFields?: never
        tenantFieldAccess?: never
      }
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
  userHasAccessToAllTenants?: (
    user: ConfigTypes extends { user } ? ConfigTypes['user'] : User,
  ) => boolean
}

export type Tenant<IDType = number | string> = {
  id: IDType
  name: string
}

export type UserWithTenantsField = {
  tenants: {
    tenant: number | string | Tenant
  }[]
} & User
