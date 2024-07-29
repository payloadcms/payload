import type { MigrationTemplateArgs } from 'payload'

export const getMigrationTemplate = ({
  downSQL,
  imports,
  upSQL,
}: MigrationTemplateArgs): string => `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
${imports ? `${imports}\n` : ''}
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
${upSQL}
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
${downSQL}
}
`
