const imports = `import { migrateJobsProcessingLease } from '@payloadcms/db-mongodb/migration-utils'`
const upSQL = `await migrateJobsProcessingLease({
  direction: 'up',
  req,
})`
const downSQL = `await migrateJobsProcessingLease({
  direction: 'down',
  req,
})`

export { downSQL, imports, upSQL }
