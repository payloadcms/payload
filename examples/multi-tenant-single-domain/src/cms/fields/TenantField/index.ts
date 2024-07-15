import type { Field } from 'payload'

import { isSuperAdmin } from '../../access/isSuperAdmin.js'
import { tenantFieldUpdate } from './access/update.js'
import { TenantFieldComponent } from './components/Field.js'
import { autofillTenant } from './hooks/autofillTenant.js'

export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  access: {
    read: () => true,
    update: (args) => {
      if (isSuperAdmin(args)) return true
      return tenantFieldUpdate(args)
    },
  },
  admin: {
    components: {
      Field: TenantFieldComponent,
    },
    position: 'sidebar',
  },
  hasMany: false,
  hooks: {
    beforeValidate: [autofillTenant],
  },
  index: true,
  relationTo: 'tenants',
  required: true,
}
