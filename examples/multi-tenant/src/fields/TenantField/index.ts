import type { Field } from 'payload'

import { isSuperAdmin } from '../../access/isSuperAdmin'
import { tenantFieldUpdate } from './access/update'
import { autofillTenant } from './hooks/autofillTenant'

export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  access: {
    read: () => true,
    update: (args) => {
      if (isSuperAdmin(args)) {return true}
      return tenantFieldUpdate(args)
    },
  },
  admin: {
    components: {
      Field: '@/fields/TenantField/components/Field#TenantFieldComponent',
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
