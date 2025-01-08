# Multi Tenant Plugin

A plugin for [Payload](https://github.com/payloadcms/payload) to easily manage multiple tenants from within your admin panel.

- [Source code](https://github.com/payloadcms/payload/tree/main/packages/plugin-multi-tenant)
<!-- - [Documentation](https://payloadcms.com/docs/plugins/multi-tenant)
- [Documentation source](https://github.com/payloadcms/payload/tree/main/docs/plugins/multi-tenant.mdx) -->

## Plugin config example

```ts
multiTenantPlugin({
  /**
   * Enable debugging:
   * - shows the relationship field on enabled collection documents
   *
   * optional - @default false
   */
  debug: false,
  /**
   * Enables/Disables the plugin
   *
   * optional - @default true
   */
  enabled: true,
  /**
   * The slug of the tenants collection you added to your config
   *
   * optional - @default 'tenants'
   */
  tenantsSlug: 'tenants',
  /**
   * Define what collections you would like multi-tenancy to apply to
   *
   * Keyed on the slug of the collection
   */
  collections: {
    pages: {
      /**
       * Used to opt out of using the provided baseListFilter
       *
       * You can use the exported utility "getTenantFilter" within your own list filter
       *
       * optional - @default true
       */
      useBaseListFilter: true
      /**
       * Used to opt out of the merged access control provided
       *
       * You can use the exported utility "getTenantAccess" within your access control functions
       *
       * optional - @default true
       */
      useTenantAccess: true
      /**
       * Used to make a collection feel like a global. When navigating to the list view, they will be redirected to the document view.
       *
       * optional - @default false
       */
      isGlobal: false
    },
    /**
     * Custom configuration for the tenant field placed on every enabled collection
     */
    documentTenantField: {
      // optional - provide access control on the injected tenant field
      access: {
        create,
        read,
        update,
      },
      /**
       * Name of the field
       *
       * optional - @default true
       */
      name: 'tenant',
    },
    /**
     * Function that allows you to determine if certain users should have access to all tenants
     *
     * optional - @default () => false
     */
    userHasAccessToAllTenants: (user) => user.isSuperAdmin === true
    /**
     * Options for the array field that gets added to the users collection.
     *
     * The field is an array of rows, by default each row has a relationship to a tenant
     *
     * optional - @default undefined
     */
    userTenantsField: {
      /**
       * Allows you to set access control on the array field
       *
       * optional - @default undefined
       */
      access: {
        create, // optional
        read, // optional
        update, // optional
      },
      /**
       * If you want to add additional fields to the tenant rows, you can specify them under rowFields
       *
       * optional - @default undefined
       */
      rowFields: [
        // Example adding a field onto the array row
        {
          name: 'roles',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'User', value: 'user' },
          ],
        },
      ],
    }
  },
})
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
    multiTenantPlugin({
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
