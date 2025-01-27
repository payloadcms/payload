import type { Tenant } from '../payload-types'

export const tenant1: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Tenant 1',
  clientURL: 'http://localhost:3001',
}
