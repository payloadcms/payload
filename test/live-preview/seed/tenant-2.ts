import type { Tenant } from '../payload-types'

export const tenant2: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Tenant 2',
  clientURL: 'https://payloadcms.com',
}
