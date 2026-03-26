import type { Tenant } from '../payload-types.js'

import { serverURL } from '../../__helpers/shared/serverURL.js'

export const tenant1: Omit<Tenant, 'createdAt' | 'id' | 'updatedAt'> = {
  title: 'Tenant 1',
  clientURL: serverURL,
}
