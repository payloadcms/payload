import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import type { SanitizedConfig } from '../config/types.js'

export const drizzleStudio = async (config: SanitizedConfig) => {
  const { default: payload } = await import('../index.js')

  // Initialize payload to get database adapter
  await payload.init({
    config,
    disableDBConnect: true,
    disableOnInit: true,
  })

  // Check if the database adapter supports Drizzle
  const supportedAdapters = [
    '@payloadcms/db-postgres',
    '@payloadcms/db-vercel-postgres',
    '@payloadcms/db-sqlite',
  ]
  if (!supportedAdapters.includes(payload.db.packageName)) {
    payload.logger.error({
      msg: `${payload.db.packageName} does not support Drizzle Studio. Only PostgreSQL and SQLite adapters are supported.`,
    })
    process.exit(1)
  }

  // Create temporary drizzle.config.json
  const tempConfigPath = path.join(process.cwd(), 'drizzle.config.json')
  let drizzleConfig: any = {}

  try {
    // Generate schema first to ensure it's up to date
    if (typeof payload.db.generateSchema === 'function') {
      await payload.db.generateSchema({
        log: false,
        prettify: true,
      })
    }

    // Check if schema file exists
    const schemaPath = path.join(process.cwd(), 'payload-generated-schema.ts')

    if (!fs.existsSync(schemaPath)) {
      payload.logger.error({
        msg: 'Schema file payload-generated-schema.ts not found. Please run "payload generate:db-schema" first.',
      })
      process.exit(1)
    }

    // Configure based on database type
    if (
      payload.db.packageName === '@payloadcms/db-postgres' ||
      payload.db.packageName === '@payloadcms/db-vercel-postgres'
    ) {
      const adapter = payload.db as any

      // Extract connection string from poolOptions
      let connectionString = adapter.poolOptions?.connectionString

      if (!connectionString) {
        connectionString = process.env.DATABASE_URI || process.env.POSTGRES_URL
      }

      if (!connectionString) {
        payload.logger.error({
          msg: 'No PostgreSQL connection string found. Please set DATABASE_URI or POSTGRES_URL environment variable.',
        })
        process.exit(1)
      }

      drizzleConfig = {
        dbCredentials: {
          url: connectionString,
        },
        dialect: 'postgresql',
        out: './drizzle',
        schema: './payload-generated-schema.ts',
      }

      // If using custom schema name, add it to the config
      if (adapter.schemaName) {
        drizzleConfig.schemaFilter = [adapter.schemaName]
      }
    } else if (payload.db.packageName === '@payloadcms/db-sqlite') {
      const adapter = payload.db as any

      // Extract database URL from clientConfig
      let databaseUrl = adapter.clientConfig?.url
      if (!databaseUrl) {
        databaseUrl = process.env.DATABASE_URI || 'file:./payload.db'
      }

      drizzleConfig = {
        dbCredentials: {
          url: databaseUrl,
        },
        dialect: 'sqlite',
        out: './drizzle',
        schema: './payload-generated-schema.ts',
      }
    } else {
      payload.logger.error({
        msg: `Database adapter ${payload.db.packageName} is not supported for Drizzle Studio. Only PostgreSQL and SQLite are supported.`,
      })
      process.exit(1)
    }

    // Write temporary config file
    fs.writeFileSync(tempConfigPath, JSON.stringify(drizzleConfig, null, 2))

    payload.logger.info({
      msg: 'Starting Drizzle Studio...',
    })

    // Launch Drizzle Studio
    const studioProcess = spawn('npx', ['drizzle-kit', 'studio', '--config', tempConfigPath], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    // Handle process cleanup
    const cleanup = () => {
      try {
        if (fs.existsSync(tempConfigPath)) {
          fs.unlinkSync(tempConfigPath)
          payload.logger.info({
            msg: 'Cleaned up temporary drizzle.config.json',
          })
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    // Clean up on exit
    process.on('SIGINT', () => {
      cleanup()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      cleanup()
      process.exit(0)
    })

    studioProcess.on('error', (err) => {
      payload.logger.error({
        err,
        msg: 'Failed to start Drizzle Studio. Make sure drizzle-kit is installed.',
      })
      cleanup()
      process.exit(1)
    })

    studioProcess.on('exit', (code) => {
      cleanup()
      if (code !== 0) {
        payload.logger.error({
          msg: `Drizzle Studio exited with code ${code}`,
        })
        process.exit(code || 1)
      }
    })
  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath)
      }
    } catch (err) {
      // Ignore cleanup errors
    }

    payload.logger.error({
      err: error,
      msg: 'Failed to start Drizzle Studio',
    })
    process.exit(1)
  }
}
