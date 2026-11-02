const imports = `import { migrateSizesToVariants } from '@payloadcms/db-mongodb/migration-utils'`
const upSQL = `  await migrateSizesToVariants({ payload, req })
`
const downSQL = `  await migrateSizesToVariants({ direction: 'down', payload, req })
`

export { downSQL, imports, upSQL }
