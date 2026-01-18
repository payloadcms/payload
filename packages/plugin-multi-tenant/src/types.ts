import type { AcceptedLanguages } from '@ruya.sa/translations'
import type {
  AccessArgs,
  AccessResult,
  ArrayField,
  CollectionConfig,
  CollectionSlug,
  Field,
  RelationshipField,
  SingleRelationshipField,
  TypedUser,
} from '@ruya.sa/payload'

export type MultiTenantPluginConfig<ConfigTypes = unknown> = {
  /**
   * Base path for your application
   *
   * https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
   *
   * @default undefined
   */
  basePath?: string
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
       * Override the access result from the collection access control functions
       *
       * The function receives:
       *  - accessResult: the original result from the access control function
       *  - accessKey: 'read', 'create', 'update', 'delete', 'readVersions', or 'unlock'
       *  - ...restOfAccessArgs: the original arguments passed to the access control function
       */
      accessResultOverride?: CollectionAccessResultOverride
      /**
       * Opt out of adding the tenant field and place
       * it manually using the `tenantField` export from the plugin
       */
      customTenantField?: boolean
      /**
       * Set to `true` if you want the collection to behave as a global
       *
       * @default false
       */
      isGlobal?: boolean
      /**
       * Overrides for the tenant field, will override the entire tenantField configuration
       */
      tenantFieldOverrides?: CollectionTenantFieldConfigOverrides
      /**
       * Set to `false` if you want to manually apply the baseListFilter
       * Set to `false` if you want to manually apply the baseFilter
       *
       * @default true
       */
      useBaseFilter?: boolean
      /**
       * @deprecated Use `useBaseFilter` instead. If both are defined,
       * `useBaseFilter` will take precedence. This property remains only
       * for backward compatibility and may be removed in a future version.
       *
       * Originally, `baseListFilter` was intended to filter only the List View
       * in the admin panel. However, base filtering is often required in other areas
       * such as internal link relationships in the Lexical editor.
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
   * Localization for the plugin
   */
  i18n?: {
    translations: {
      [key in AcceptedLanguages]?: {
        /**
         * Shown inside 3 dot menu on edit document view
         *
         * @default 'Assign Tenant'
         */
        'assign-tenant-button-label'?: string
        /**
         * Shown as the title of the assign tenant modal
         *
         * @default 'Assign "{{title}}"'
         */
        'assign-tenant-modal-title'?: string
        /**
         * Shown as the label for the assigned tenant field in the assign tenant modal
         *
         * @default 'Assigned Tenant'
         */
        'field-assignedTenant-label'?: string
        /**
         * Shown as the label for the global tenant selector in the admin UI
         *
         * @default 'Filter by Tenant'
         */
        'nav-tenantSelector-label'?: string
      }
    }
  }
  /**
   * Field configuration for the field added to all tenant enabled collections
   */
  tenantField?: RootTenantFieldConfigOverrides
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
   * Customize tenant selector label
   *
   * Either a string or an object where the keys are i18n codes and the values are the string labels
   *
   * @deprecated Use `i18n.translations` instead.
   */
  tenantSelectorLabel?:
    | Partial<{
        [key in AcceptedLanguages]?: string
      }>
    | string
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
    user: ConfigTypes extends { user: unknown } ? ConfigTypes['user'] : TypedUser,
  ) => boolean
  /**
   * Override the access result on the users collection access control functions
   *
   * The function receives:
   *  - accessResult: the original result from the access control function
   *  - accessKey: 'read', 'create', 'update', 'delete', 'readVersions', or 'unlock'
   *  - ...restOfAccessArgs: the original arguments passed to the access control function
   */
  usersAccessResultOverride?: CollectionAccessResultOverride
  /**
   * Opt out of adding access constraints to the tenants collection
   */
  useTenantsCollectionAccess?: boolean
  /**
   * Opt out including the baseListFilter to filter tenants by selected tenant
   */
  useTenantsListFilter?: boolean

  /**
   * Opt out including the baseListFilter to filter users by selected tenant
   */
  useUsersTenantFilter?: boolean
}

export type RootTenantFieldConfigOverrides = Partial<
  Omit<
    SingleRelationshipField,
    | '_sanitized'
    | 'hidden'
    | 'index'
    | 'localized'
    | 'max'
    | 'maxRows'
    | 'min'
    | 'minRows'
    | 'relationTo'
    | 'required'
    | 'type'
    | 'unique'
    | 'virtual'
  >
>

export type CollectionTenantFieldConfigOverrides = Partial<
  Omit<RootTenantFieldConfigOverrides, 'name'>
>

export type Tenant<IDType = number | string> = {
  id: IDType
  name: string
}

export type UserWithTenantsField = {
  tenants?:
    | {
        tenant: number | string | Tenant
      }[]
    | null
} & TypedUser

type AllAccessKeysT<T extends readonly string[]> = T[number] extends keyof Omit<
  Required<CollectionConfig>['access'],
  'admin'
>
  ? keyof Omit<Required<CollectionConfig>['access'], 'admin'> extends T[number]
    ? T
    : never
  : never

export type AllAccessKeys = AllAccessKeysT<
  ['create', 'read', 'update', 'delete', 'readVersions', 'unlock']
>

export type CollectionAccessResultOverride = ({
  accessKey,
  accessResult,
}: {
  accessKey: AllAccessKeys[number]
  accessResult: AccessResult
} & AccessArgs) => AccessResult | Promise<AccessResult>
