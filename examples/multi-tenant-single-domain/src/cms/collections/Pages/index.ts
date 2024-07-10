import type { CollectionConfig } from 'payload'
import { tenantField } from '../../fields/TenantField'
import { byTenant } from './access/byTenant'
import { ensureUniqueSlug } from './hooks/ensureUniqueSlug'
import { externalReadAccess } from './access/externalReadAccess'
import { isPayloadAdminPanel } from '../../utilities/isPayloadAdminPanel'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    update: byTenant,
    read: async (args) => {
      // when viewing pages inside the admin panel
      // restrict access to the ones your user has access to
      if (isPayloadAdminPanel(args.req)) return byTenant(args)

      // when viewing pages from outside the admin panel
      // you should be able to see your tenants and public tenants
      return externalReadAccess(args)
    },
    delete: byTenant,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      defaultValue: 'home',
      hooks: {
        beforeValidate: [ensureUniqueSlug],
      },
    },
    tenantField,
  ],
}
