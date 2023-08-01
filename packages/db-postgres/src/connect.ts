import type { Connect } from 'payload/dist/database/types';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client, ClientConfig, Pool, PoolConfig } from 'pg';
import { dropdb } from 'pgtools';

import type { PostgresAdapter } from '.';

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  payload,
) {
  let db: NodePgDatabase<Record<string, never>>;

  try {
    let config: string | ClientConfig | PoolConfig;
    if ('pool' in this && this.pool !== false) {
      const pool = new Pool(this.pool);
      db = drizzle(pool);
      config = this.pool;
    }

    if ('client' in this && this.client !== false) {
      const client = new Client(this.client);
      await client.connect();
      db = drizzle(client);
      config = this.client;
    }

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      this.payload.logger.info('---- DROPPING DATABASE ----');

      // Get database name from config
      let databaseName: string | undefined;
      if (typeof config === 'string') {
        databaseName = config.split('/').pop() || '';
      } else {
        databaseName = config.database;
      }

      if (!databaseName) {
        throw new Error(
          'Cannot drop database. Database name not found in config.',
        );
      }

      await dropdb(config, databaseName);
      this.payload.logger.info('---- DROPPED DATABASE ----');
    }
  } catch (err) {
    payload.logger.error(
      `Error: cannot connect to Postgres. Details: ${err.message}`,
      err,
    );
    process.exit(1);
  }

  this.payload.logger.info('Connected to Postgres successfully');
  this.db = db;
};
