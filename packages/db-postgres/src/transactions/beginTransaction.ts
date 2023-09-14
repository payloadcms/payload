import type { PgTransactionConfig } from 'drizzle-orm/pg-core';
import type { BeginTransaction } from 'payload/database';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client, Pool } from 'pg';
import { v4 as uuid } from 'uuid';

import type { DrizzleDB } from '../types';

export const beginTransaction: BeginTransaction = async function beginTransaction(
  options: PgTransactionConfig = {},
) {
  let id;
  try {
    let db: DrizzleDB;
    id = uuid();
    if ('pool' in this && this.pool !== false) {
      const pool = new Pool(this.pool);
      db = drizzle(pool, { schema: this.schema });
      await pool.connect();
    }

    if ('client' in this && this.client !== false) {
      const client = new Client(this.client);
      db = drizzle(client, { schema: this.schema });
      await client.connect();
    }

    this.sessions[id] = db;

    await db.execute(sql`BEGIN;`);
  } catch (err) {
    this.payload.logger.error(
      `Error: cannot begin transaction: ${err.message}`,
      err,
    );
    process.exit(1);
  }

  return id;
};
