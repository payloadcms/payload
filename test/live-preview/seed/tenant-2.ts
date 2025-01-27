import type { Tenant } from '../payload-types'

export const tenant2: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Tenant 2',
  clientURL: 'http://localhost:3002',
}
