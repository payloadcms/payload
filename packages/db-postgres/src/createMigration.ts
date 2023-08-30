/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { CreateMigration } from 'payload/database';

import drizzleKit from 'drizzle-kit/utils.js';
import fs from 'fs';
const { generateDrizzleJson, pushSchema } = drizzleKit;
import type { DatabaseAdapter, Init } from 'payload/database';

import { eq } from 'drizzle-orm';
import { jsonb, numeric, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';
import { SanitizedCollectionConfig } from 'payload/types';
import { configToJSONSchema } from 'payload/utilities';
import prompts from 'prompts';

import type { GenericEnum, GenericRelation, GenericTable, PostgresAdapter } from './types.js';

import { buildTable } from './schema/build.js';

const migrationTemplate = (upSQL?: string) => `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  ${upSQL ? `await payload.db.db.execute(\`${upSQL}\`);` : '// Migration code'}
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`;

export const createMigration: CreateMigration = async function createMigration(
  this: PostgresAdapter,
  payload,
  migrationDir,
  migrationName,
) {
  payload.logger.info({ msg: 'Creating migration from postgres adapter...' });
  const dir = migrationDir || '.migrations'; // TODO: Verify path after linking
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T');
  const formattedDate = yyymmdd.replace(/\D/g, '');
  const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '');

  const timestamp = `${formattedDate}_${formattedTime}`;

  const formattedName = migrationName.replace(/\W/g, '_');
  const fileName = `${timestamp}_${formattedName}.ts`;
  const filePath = `${dir}/${fileName}`;

  const snapshotJSON = fs.readFileSync(`${dir}/drizzle-snapshot.json`, 'utf8');
  const drizzleJsonBefore = generateDrizzleJson(JSON.parse(snapshotJSON));
  const drizzleJsonAfter = generateDrizzleJson(this.schema, drizzleJsonBefore.id);
  const sqlStatements = await generateMigration(drizzleJsonBefore, drizzleJsonAfter);
  fs.writeFileSync(filePath, migrationTemplate(sqlStatements.length ? sqlStatements?.join('\n') : undefined));

  // TODO:
  // Get the most recent migration schema from the file system
  // we will use that as the "before"
  // then for after, we will call `connect` and `init` to create the new schema dynamically
  // once we have new schema created, we will convert it to JSON using generateDrizzleJSON
  // we then run `generateMigration` to get a list of SQL statements to pair 'em up
  // and then inject them each into the `migrationTemplate` above,
  // outputting the file into the migrations folder accordingly
  // also make sure to output the JSON schema snapshot into a `./migrationsDir/meta` folder like Drizzle does
};
