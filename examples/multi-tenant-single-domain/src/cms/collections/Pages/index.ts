import type { CollectionConfig } from 'payload'

import { tenantField } from '../../fields/TenantField'
import { isPayloadAdminPanel } from '../../utilities/isPayloadAdminPanel'
import { byTenant } from './access/byTenant'
import { externalReadAccess } from './access/externalReadAccess'
import { ensureUniqueSlug } from './hooks/ensureUniqueSlug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    delete: byTenant,
    read: (args) => {
      // when viewing pages inside the admin panel
      // restrict access to the ones your user has access to
      if (isPayloadAdminPanel(args.req)) return byTenant(args)

      // when viewing pages from outside the admin panel
      // you should be able to see your tenants and public tenants
      return externalReadAccess(args)
    },
    update: byTenant,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      defaultValue: 'home',
      hooks: {
        beforeValidate: [ensureUniqueSlug],
      },
      index: true,
    },
    tenantField,
  ],
}
