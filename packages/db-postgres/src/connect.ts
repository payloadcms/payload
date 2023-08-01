/* eslint-disable @typescript-eslint/no-var-requires */
import type { Connect } from 'payload/dist/database/types';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Client, Pool } from 'pg';

import type { PostgresAdapter } from '.';

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  payload,
) {
  let connection: NodePgDatabase<Record<string, never>>;

  try {
    if ('pool' in this && this.pool !== false) {
      const pool = new Pool(this.pool);
      connection = drizzle(pool);
    }

    if ('client' in this && this.client !== false) {
      const client = new Client(this.client);
      await client.connect();
      connection = drizzle(client);
    }

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      this.payload.logger.info('---- DROPPING DATABASE ----');
      // NEED TO DROP DATABASE HERE
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
  this.connection = connection;
};
