import type { ParsedArgs } from 'minimist'

export type MigrateAPIKeysCLIOptions = {
  batchSize?: number
  collections?: string[]
  dryRun: boolean
}

/** Parses `migrate:api-keys` CLI flags: `--dry-run`, `--batch-size <n>`, `--collections a,b`. */
export const parseMigrateAPIKeysArgs = (parsedArgs: ParsedArgs): MigrateAPIKeysCLIOptions => {
  const batchSizeArg = parsedArgs['batch-size']
  const collectionsArg = parsedArgs.collections as string | undefined

  return {
    batchSize: batchSizeArg === undefined ? undefined : Number(batchSizeArg),
    collections: collectionsArg ? collectionsArg.split(',').map((slug) => slug.trim()) : undefined,
    dryRun: Boolean(parsedArgs['dry-run']),
  }
}
