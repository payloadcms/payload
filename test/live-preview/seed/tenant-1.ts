import type { Tenant } from '../payload-types.js'

export const tenant1: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Tenant 1',
  clientURL: `http://localhost:${process.env.PORT || 3000}`,
}
