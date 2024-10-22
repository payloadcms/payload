import type { CollectionConfig } from 'payload'

import { tenantField } from '../../fields/TenantField'
import { isPayloadAdminPanel } from '../../utilities/isPayloadAdminPanel'
import { canMutatePage, filterByTenantRead } from './access/byTenant'
import { externalReadAccess } from './access/externalReadAccess'
import { ensureUniqueSlug } from './hooks/ensureUniqueSlug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: canMutatePage,
    delete: canMutatePage,
    read: (args) => {
      // when viewing pages inside the admin panel
      // restrict access to the ones your user has access to
      if (isPayloadAdminPanel(args.req)) {return filterByTenantRead(args)}

      // when viewing pages from outside the admin panel
      // you should be able to see your tenants and public tenants
      return externalReadAccess(args)
    },
    update: canMutatePage,
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
