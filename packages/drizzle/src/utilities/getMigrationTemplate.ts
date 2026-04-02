import type { MigrationTemplateArgs } from 'payload'

export const indent = (text: string) =>
  text
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')

export const getMigrationTemplate = ({
  downSQL,
  imports,
  packageName,
  upSQL,
}: MigrationTemplateArgs): string => `import { MigrateUpArgs, MigrateDownArgs, sql } from '${packageName}'
${imports ? `${imports}\n` : ''}
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
${indent(upSQL)}
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
${indent(downSQL)}
}
`
