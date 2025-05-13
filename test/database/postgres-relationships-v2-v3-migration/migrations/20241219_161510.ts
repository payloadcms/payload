import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Migration code
}
