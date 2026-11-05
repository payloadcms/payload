import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { AnyD1Database } from 'drizzle-orm/d1'
import type { Connect, Migration } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/d1'

import type { SQLiteD1Adapter } from './types.js'

import { createD1LibsqlClientShim } from './d1-libsql-client-shim.js'
import { D1HttpBinding } from './http-binding/index.js'

export const connect: Connect = async function connect(
  this: SQLiteD1Adapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  this.schema = {
    ...this.tables,
    ...this.relations,
  }

  try {
    const logger = this.logger || false
    const readReplicas = this.readReplicas

    let binding: AnyD1Database | undefined = this.binding
    let httpBinding = false

    if (!binding && this.httpConfig) {
      binding = new D1HttpBinding(this.httpConfig) as unknown as AnyD1Database
      this.binding = binding
      httpBinding = true
    }

    if (!binding) {
      throw new Error('db-d1-sqlite requires either a D1 `binding` or `http` config')
    }

    // `readReplicas` uses D1 `withSession` and only exists on a Workers binding — not on HTTP.
    // sqliteD1Adapter rejects http + readReplicas; repeat here if adapter state was mutated.
    if (httpBinding && readReplicas === 'first-primary') {
      throw new Error(
        'db-d1-sqlite: `readReplicas` is not supported with `http`. Use a Cloudflare Workers deployment with a D1 binding (this feature is not available over the HTTP API).',
      )
    }

    if (readReplicas && readReplicas === 'first-primary') {
      // @ts-expect-error - need to have types that support withSession binding from D1
      binding = this.binding.withSession('first-primary')
    }

    this.drizzle = drizzle(binding!, {
      logger,
      schema: this.schema,
    })

    this.client = httpBinding
      ? (createD1LibsqlClientShim(binding!) as SQLiteD1Adapter['client'])
      : (this.drizzle.$client as SQLiteD1Adapter['client'])

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    this.payload.logger.error({ err, msg: `Error: cannot connect to SQLite: ${message}` })
    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }

    throw new Error(`Error: cannot connect to SQLite: ${message}`)
  }

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_MIGRATING !== 'true' &&
    this.push !== false
  ) {
    await pushDevSchema(this as unknown as DrizzleAdapter)
  }

  if (typeof this.resolveInitializing === 'function') {
    this.resolveInitializing()
  }

  if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations as Migration[] })
  }
}
