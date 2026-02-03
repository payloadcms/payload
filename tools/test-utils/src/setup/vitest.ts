import dotenv from 'dotenv'

import type { DatabaseAdapterType } from '../shared/database/index.js'

import { generateDatabaseAdapter } from '../shared/database/index.js'

export type VitestSetupOptions = {
  /**
   * Custom path to .env file. Defaults to process.cwd()
   */
  envPath?: string
  /**
   * Directory where databaseAdapter.js will be written.
   * Defaults to process.cwd()
   */
  outputDir?: string
}

/**
 * Sets up the vitest environment for Payload integration tests.
 * - Loads environment variables from .env
 * - Sets required test environment variables
 * - Generates the database adapter based on PAYLOAD_DATABASE env var
 */
export function setupVitest(options: VitestSetupOptions = {}): void {
  const { envPath, outputDir = process.cwd() } = options

  if (envPath) {
    dotenv.config({ path: envPath })
  } else {
    dotenv.config()
  }

  process.env.PAYLOAD_DISABLE_ADMIN = 'true'
  process.env.PAYLOAD_DROP_DATABASE = 'true'
  process.env.PAYLOAD_PUBLIC_CLOUD_STORAGE_ADAPTER = 's3'
  process.env.NODE_OPTIONS = '--no-deprecation'
  process.env.PAYLOAD_CI_DEPENDENCY_CHECKER = 'true'
  process.env.PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY = 'true'

  if (!process.env.PAYLOAD_DATABASE) {
    process.env.PAYLOAD_DATABASE = 'mongodb'
  }

  process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379'

  generateDatabaseAdapter(process.env.PAYLOAD_DATABASE as DatabaseAdapterType, outputDir)
}

setupVitest()
