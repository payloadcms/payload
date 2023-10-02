export const migrationTemplate = `
import {
  MigrateUpArgs,
  MigrateDownArgs,
} from "@payloadcms/db-mongodb";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
};

export async function down({ payload }: MigrateUpArgs): Promise<void> {
  // Migration code
};
`
