/* eslint-disable no-restricted-syntax, no-await-in-loop */
import fs from 'fs';
import { migrationTemplate } from './migrationTemplate';
import { CreateMigration } from '../types';

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
};
