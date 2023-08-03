import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Connect } from 'payload/dist/database/types';
import { Client, Pool } from 'pg';

import type { PostgresAdapter } from '.';
import { DrizzleDB } from './types';

export const connect: Connect = async function connect(
  this: PostgresAdapter,
  payload,
) {
  let db: DrizzleDB;

  try {
    if ('pool' in this && this.pool !== false) {
      const pool = new Pool(this.pool);
      db = drizzle(pool);
      await pool.connect();
    }

    if ('client' in this && this.client !== false) {
      const client = new Client(this.client);
      db = drizzle(client);
      await client.connect();
    }

    if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
      this.payload.logger.info('---- DROPPING TABLES ----');
      await db.execute(sql`drop schema public cascade;\ncreate schema public;`);
      this.payload.logger.info('---- DROPPED TABLES ----');
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
