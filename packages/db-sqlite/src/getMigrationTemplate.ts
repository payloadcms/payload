import type { MigrationTemplateArgs } from 'payload'

export const indent = (text: string) =>
  text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')

export const getMigrationTemplate = ({
  downSQL,
  imports,
  upSQL,
}: MigrationTemplateArgs): string => `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'
${imports ? `${imports}\n` : ''}
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
${indent(upSQL)}
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
${indent(downSQL)}
}
`
