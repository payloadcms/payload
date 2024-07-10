import type { Field } from 'payload'
import { tenantFieldUpdate } from './access/update'
import { autofillTenant } from './hooks/autofillTenant'
import { TenantFieldComponent } from './components/Field'
import { isSuperAdmin } from '../../access/isSuperAdmin'

export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  index: true,
  relationTo: 'tenants',
  hasMany: false,
  required: true,
  access: {
    read: () => true,
    update: (args) => {
      if (isSuperAdmin(args)) return true
      return tenantFieldUpdate(args)
    },
  },
  hooks: {
    beforeValidate: [autofillTenant],
  },
  admin: {
    position: 'sidebar',
    components: {
      Field: TenantFieldComponent,
    },
  },
}
