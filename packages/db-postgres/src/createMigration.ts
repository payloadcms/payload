/* eslint-disable no-restricted-syntax, no-await-in-loop */
import fs from 'fs';
import { CreateMigration } from 'payload/dist/database/types';

const migrationTemplate = `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  {{SQL}}
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`;

export const createMigration: CreateMigration = async function createMigration({
  payload,
  migrationDir,
  migrationName,
}) {
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
  fs.writeFileSync(filePath, migrationTemplate);
  payload.logger.info({ msg: `Migration created at ${filePath}` });

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
