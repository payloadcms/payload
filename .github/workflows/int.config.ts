import { createIntConfig } from './utilities/int-matrix.js'

createIntConfig({
  databases: [
    'mongodb',
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
  shards: 2,
})
