import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

import type { Config as ConfigType } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { AutosaveGlobal } from './collections/AutosaveGlobal.js'
import { Menu } from './collections/Menu.js'
import { MenuItems } from './collections/MenuItems.js'
import { Relationships } from './collections/Relationships.js'
import { Tenants } from './collections/Tenants.js'
import { Users } from './collections/Users/index.js'
import { seed } from './seed/index.js'
import { autosaveGlobalSlug, menuItemsSlug, menuSlug, notTenantedSlug } from './shared.js'

export default buildConfigWithDefaults({
  collections: [
    Tenants,
    Users,
    MenuItems,
    Menu,
    AutosaveGlobal,
    Relationships,
    {
      slug: notTenantedSlug,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
  admin: {
    autoLogin: false,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeLogin: ['/components/BeforeLogin/index.js#BeforeLogin'],
      graphics: {
        Logo: '/components/Logo/index.js#Logo',
        Icon: '/components/Icon/index.js#Icon',
      },
    },
  },
  onInit: seed,
  plugins: [
    multiTenantPlugin<ConfigType>({
      // debug: true,
      userHasAccessToAllTenants: (user) => Boolean(user.roles?.includes('admin')),
      useTenantsCollectionAccess: false,
      tenantField: {
        access: {},
      },
      collections: {
        [menuItemsSlug]: {
          useTenantAccess: false,
        },
        [menuSlug]: {
          isGlobal: true,
        },
        [autosaveGlobalSlug]: {
          isGlobal: true,
        },

        ['relationships']: {},
      },
      i18n: {
        translations: {
          en: {
            'field-assignedTenant-label': 'Site',
            'nav-tenantSelector-label': 'Filter by Site',
            'assign-tenant-button-label': 'Assign Site',
          },
        },
      },
    }),
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
    filterAvailableLocales: async ({ locales, req }) => {
      const tenant = getTenantFromCookie(req.headers, 'text')
      if (tenant) {
        const fullTenant = await req.payload.findByID({
          collection: 'tenants',
          id: tenant,
        })
        if (
          fullTenant &&
          Array.isArray(fullTenant.selectedLocales) &&
          fullTenant.selectedLocales.length > 0
        ) {
          if (fullTenant.selectedLocales.includes('allLocales')) {
            return locales
          }
          return locales.filter((locale) =>
            fullTenant.selectedLocales?.includes(locale.code as any),
          )
        }
      }
      return locales
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
