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
    'postgres-uuidv7',
    'postgres-read-replica',
    'supabase',
    'sqlite',
    'sqlite-uuid',
    'sqlite-uuidv7',
  ],
  shards: 3,
})
