import type { ArrayField, CollectionSlug, Field, RelationshipField, User } from 'payload'

export type MultiTenantPluginConfig<ConfigTypes = unknown> = {
  /**
   * After a tenant is deleted, the plugin will attempt to clean up related documents
   * - removing documents with the tenant ID
   * - removing the tenant from users
   *
   * @default true
   */
  cleanupAfterTenantDelete?: boolean
  /**
   * Automatically
   */
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
        /**
         * Access configuration for the array field
         */
        arrayFieldAccess?: ArrayField['access']
        /**
         * Name of the array field
         *
         * @default 'tenants'
         */
        arrayFieldName?: string
        /**
         * Name of the tenant field
         *
         * @default 'tenant'
         */
        arrayTenantFieldName?: string
        /**
         * When `includeDefaultField` is `true`, the field will be added to the users collection automatically
         */
        includeDefaultField?: true
        /**
         * Additional fields to include on the tenants array field
         */
        rowFields?: Field[]
        /**
         * Access configuration for the tenant field
         */
        tenantFieldAccess?: RelationshipField['access']
      }
    | {
        arrayFieldAccess?: never
        arrayFieldName?: string
        arrayTenantFieldName?: string
        /**
         * When `includeDefaultField` is `false`, you must include the field on your users collection manually
         */
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
    user: ConfigTypes extends { user: unknown } ? ConfigTypes['user'] : User,
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
