export const migrationTemplate = `
import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Migration code
};

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
};
`
