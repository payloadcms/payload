import type { BeginTransaction } from 'payload/dist/database/types';
import { PgTransactionConfig } from 'drizzle-orm/pg-core';
import { v4 as uuid } from 'uuid';
import { Client, Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { DrizzleDB } from '../types';

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
