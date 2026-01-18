export const indent = (text)=>text.split('\n').map((line)=>`  ${line}`).join('\n');
export const getMigrationTemplate = ({ downSQL, imports, packageName, upSQL })=>`import { MigrateUpArgs, MigrateDownArgs, sql } from '${packageName}'
${imports ? `${imports}\n` : ''}
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
${indent(upSQL)}
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
${indent(downSQL)}
}
`;

//# sourceMappingURL=getMigrationTemplate.js.map