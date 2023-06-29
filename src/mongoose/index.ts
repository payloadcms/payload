/* eslint-disable no-restricted-syntax, no-await-in-loop */
import type { ConnectOptions } from 'mongoose';
import fs from 'fs';
import { Table } from 'console-table-printer';
import type { DatabaseAdapter, Migration } from '../database/types';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { CollectionModel } from '../collections/config/types';
import { queryDrafts } from './queryDrafts';
import { GlobalModel } from '../globals/config/types';
import { find } from './find';
import { create } from './create';
import { findVersions } from './findVersions';
import { findGlobalVersions } from './findGlobalVersions';
import type { Payload } from '../index';
import { readMigrationFiles } from '../database/migrations/readMigrationFiles';


export interface Args {
  payload: Payload;
  /** The URL to connect to MongoDB */
  url: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any;
    collections: {
      [slug: string]: CollectionModel;
    };
    globals: GlobalModel;
    versions: {
      [slug: string]: CollectionModel;
    };
  };

const migrationTemplate = `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  // Migration code
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`;

export function mongooseAdapter({
  payload,
  url,
  connectOptions,
}: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: {},
    versions: {},
    connect,
    init,
    webpack,
    migrate: async () => {
      const migrationFiles = await readMigrationFiles({ payload });
      const migrationQuery = await payload.find({
        collection: 'payload-migrations',
      });

      const existingMigrations = migrationQuery.docs as unknown as Migration[];

      // Execute 'up' function for each migration sequentially
      for (const migration of migrationFiles) {
        // Create or update migration in database
        const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);

        // Run migration if not found in database
        payload.logger.info({ msg: `Running migration ${migration.name}...` });
        if (!existingMigration || !existingMigration?.executed) {
          try {
            await migration.up({ payload });
          } catch (err: unknown) {
            payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
            throw err;
          }

          payload.logger.info({ msg: `${migration.name} done.` });

          if (!existingMigration) {
            await payload.create({
              collection: 'payload-migrations',
              data: {
                name: migration.name,
                executed: true,
              },
            });
          } else {
            await payload.update({
              collection: 'payload-migrations',
              id: existingMigration.id,
              data: {
                executed: true,
              },
            });
          }
        } else {
          payload.logger.info({ msg: `${migration.name} already executed.` });
        }
      }
    },
    migrateStatus: async () => {
      const migrationFiles = await readMigrationFiles({ payload });
      const migrationQuery = await payload.find({
        collection: 'payload-migrations',
      });

      const existingMigrations = migrationQuery.docs as unknown as Migration[];

      // Compare migration files to existing migrations
      const statuses = migrationFiles.map((migration) => {
        const existingMigration = existingMigrations.find(
          (m) => m.name === migration.name,
        );
        return {
          name: migration.name,
          ran: !!existingMigration?.executed,
        };
      });

      const p = new Table();

      statuses.forEach((s) => {
        p.addRow(s, {
          color: s.ran ? 'green' : 'red',
        });
      });
      p.printTable();
    },
    migrateDown: async () => {
      const migrationFiles = await readMigrationFiles({ payload });
      const migrationQuery = await payload.find({
        collection: 'payload-migrations',
        sort: '-name', // Q: Will this always be the most recent by sorting alphabetically?
      });

      const existingMigrations = migrationQuery.docs as unknown as Migration[];

      if (existingMigrations?.length) {
        payload.logger.info({ msg: `Most recent migration ${existingMigrations[0].name}` });
        const migration = migrationFiles.find((m) => m.name === existingMigrations[0].name);
        if (!migration) {
          throw new Error(`Migration ${existingMigrations[0].name} not found locally.`);
        }

        try {
          await migration.down({ payload });

          payload.logger.info({ msg: `${migration.name} down done.` });

          await payload.update({
            collection: 'payload-migrations',
            data: {
              executed: false,
            },
            where: {
              id: {
                equals: existingMigrations[0].id,
              },
            },
          });
        } catch (err: unknown) {
          payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
          throw err;
        }
      } else {
        payload.logger.info({ msg: 'No migrations to reset.' });
      }
    },
    migrateRefresh: async () => {
      const migrationFiles = await readMigrationFiles({ payload });
      const migrationQuery = await payload.update({
        collection: 'payload-migrations',
        data: {
          executed: false,
        },
        where: {}, // All migrations
      });

      const existingMigrations = migrationQuery.docs as unknown as Migration[];
      payload.logger.info({ existingMigrations });

      for (const migration of migrationFiles) {
        // Create or update migration in database
        const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);

        // Run migration if not found in database
        payload.logger.info({ msg: `Running migration ${migration.name}...` });
        if (!existingMigration || !existingMigration?.executed) {
          try {
            await migration.up({ payload });
          } catch (err: unknown) {
            payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
            throw err;
          }

          payload.logger.info({ msg: `${migration.name} done.` });

          if (!existingMigration) {
            await payload.create({
              collection: 'payload-migrations',
              data: {
                name: migration.name,
                executed: true,
              },
            });
          } else {
            await payload.update({
              collection: 'payload-migrations',
              id: existingMigration.id,
              data: {
                executed: true,
              },
            });
          }
        } else {
          payload.logger.info({ msg: `${migration.name} already executed.` });
        }
      }
    },
    migrateReset: async () => {
      const migrationFiles = await readMigrationFiles({ payload });
      const migrationQuery = await payload.find({
        collection: 'payload-migrations',
        sort: '-name', // Q: Will this always be the most recent by sorting alphabetically?
      });

      const existingMigrations = migrationQuery.docs as unknown as Migration[];
      if (!existingMigrations?.length) {
        payload.logger.info({ msg: 'No migrations to reset.' });
        return;
      }

      // Rollback all migrations in order
      for (const migration of migrationFiles) {
        payload.logger.info({ msg: `Evaluating migration ${migration.name}...` });

        // Create or update migration in database
        const existingMigration = existingMigrations.find((existing) => existing.name === migration.name);
        if (existingMigration?.executed) {
          try {
            await migration.down({ payload });
          } catch (err: unknown) {
            payload.logger.error({ msg: `Error running migration ${migration.name}`, err });
            throw err;
          }

          payload.logger.info({ msg: `${migration.name} down done.` });

          await payload.update({
            collection: 'payload-migrations',
            data: {
              executed: false,
            },
            where: {
              id: {
                equals: existingMigration.id,
              },
            },
          });
        }
      }
    },
    migrateFresh: async () => null,
    migrationDir: '.migrations',
    async createMigration(adapter, migrationName) {
      const migrationDir = adapter.migrationDir || '.migrations'; // TODO: Verify path after linking
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir);
      }

      const [yyymmdd, hhmmss] = new Date().toISOString().split('T');
      const formattedDate = yyymmdd.replace(/\D/g, '');
      const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '');

      const timestamp = `${formattedDate}_${formattedTime}`;

      const formattedName = migrationName.replace(/\W/g, '_');
      const fileName = `${timestamp}_${formattedName}.ts`;
      const filePath = `${migrationDir}/${fileName}`;
      fs.writeFileSync(
        filePath,
        migrationTemplate,
      );
      payload.logger.info({ msg: `Migration created at ${filePath}` });
    },
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts,
    find,
    findVersions,
    findGlobalVersions,
    create,
  };
}
