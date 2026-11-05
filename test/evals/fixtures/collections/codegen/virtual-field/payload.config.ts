import type { CollectionConfig } from 'payload'

import { stubAdapter } from '@/db-stub.js'
import { buildConfig } from 'payload'

const Users: CollectionConfig = {
  slug: 'users',
  fields: [],
  auth: true,
  versions: false,
}

export default buildConfig({
  db: stubAdapter,
  secret: 'eval-fixture',
  collections: [Users],
})
