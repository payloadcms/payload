import { createIntConfig } from './utilities/int-matrix.ts'

createIntConfig({
  databases: [
    'mongodb',
    'mongodb-uuid',
    'mongodb-atlas',
    'documentdb',
    'cosmosdb',
    'firestore',
    'postgres',
    'postgres-custom-schema',
    'postgres-uuid',
    'supabase',
    'sqlite',
    'sqlite-uuid',
  ],
  shards: 3,
})
