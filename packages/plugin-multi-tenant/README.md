# Multi Tenant Plugin

A plugin for [Payload](https://github.com/payloadcms/payload) to easily manage multiple tenants from within your admin panel.

- [Source code](https://github.com/payloadcms/payload/tree/main/packages/plugin-multi-tenant)
- [Documentation](https://payloadcms.com/docs/plugins/multi-tenant)
- [Documentation source](https://github.com/payloadcms/payload/tree/main/docs/plugins/multi-tenant.mdx)

## Installation

```bash
pnpm add @payloadcms/plugin-multi-tenant
```

## Plugin Types

```ts
type MultiTenantPluginConfig<ConfigTypes = unknown> = {
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
   * Customize tenant selector label
   *
   * Either a string or an object where the keys are i18n codes and the values are the string labels
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
    user: ConfigTypes extends { user: unknown } ? ConfigTypes['user'] : User,
  ) => boolean
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
```

### How to configure Collections as Globals for multi-tenant

When using multi-tenant, globals need to actually be configured as collections so the content can be specific per tenant.
To do that, you can mark a collection with `isGlobal` and it will behave like a global and users will not see the list view.

```ts
multiTenantPlugin({
  collections: {
    navigation: {
      isGlobal: true,
    },
  },
})
```

### Customizing access control

In some cases, the access control supplied out of the box may be too strict. For example, if you need _some_ documents to be shared between tenants, you will need to opt out of the supplied access control functionality.

By default this plugin merges your access control result with a constraint based on tenants the user has access to within an _AND_ condition. That would not work for the above scenario.

In the multi-tenant plugin config you can set `useTenantAccess` to false:

```ts
// File: payload.config.ts

import { buildConfig } from 'payload'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { getTenantAccess } from '@payloadcms/plugin-multi-tenant/utilities'
import { Config as ConfigTypes } from './payload-types'

// Add the plugin to your payload config
export default buildConfig({
  plugins: [
    multiTenantPlugin<ConfigTypes>({
      collections: {
        media: {
          useTenantAccess: false,
        },
      },
    }),
  ],
  collections: [
    {
      slug: 'media',
      fields: [
        {
          name: 'isShared',
          type: 'checkbox',
          defaultValue: false,
          // you likely want to set access control on fields like this
          // to prevent just any user from modifying it
        },
      ],
      access: {
        read: ({ req, doc }) => {
          if (!req.user) return false

          const whereConstraint = {
            or: [
              {
                isShared: {
                  equals: true,
                },
              },
            ],
          }

          const tenantAccessResult = getTenantAccess({ user: req.user })

          if (tenantAccessResult) {
            whereConstraint.or.push(tenantAccessResult)
          }

          return whereConstraint
        },
      },
    },
  ],
})
```

### Placing the tenants array field

In your users collection you may want to place the field in a tab or in the sidebar, or customize some of the properties on it.

You can use the `tenantsArrayField.includeDefaultField: false` setting in the plugin config. You will then need to manually add a `tenants` array field in your users collection.

This field cannot be nested inside a named field, ie a group, named-tab or array. It _can_ be nested inside a row, unnamed-tab, collapsible.

To make it easier, this plugin exports the field for you to import and merge in your own properties.

```ts
import type { CollectionConfig } from 'payload'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'

const customTenantsArrayField = tenantsArrayField({
  arrayFieldAccess: {}, // access control for the array field
  tenantFieldAccess: {}, // access control for the tenants field on the array row
  rowFields: [], // additional row fields
})

export const UsersCollection: CollectionConfig = {
  slug: 'users',
  fields: [
    {
      ...customTenantsArrayField,
      label: 'Associated Tenants',
    },
  ],
}
```
