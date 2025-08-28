import { execSync } from 'child_process'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

dotenv.config()

declare global {
  // Add the custom property to the NodeJS global type
  // eslint-disable-next-line no-var
  var _mongoMemoryServer: MongoMemoryReplSet | undefined
  // eslint-disable-next-line no-var
  var _postgresDockerStarted: boolean | undefined
}

/**
 * Unified database setup for Jest global setup and development
 * Automatically starts the appropriate database based on PAYLOAD_DATABASE env var:
 * - MongoDB Memory Server (default)
 * - PostgreSQL + PostGIS Docker container
 */
// eslint-disable-next-line no-restricted-exports
export default async () => {
  // Set test defaults only if not already set (allows dev to override)
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test'
  }
  process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE || 'true'
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--no-deprecation'
  process.env.DISABLE_PAYLOAD_HMR = process.env.DISABLE_PAYLOAD_HMR || 'true'

  if (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongodb') {
    // Start MongoDB Memory Server
    if (!global._mongoMemoryServer) {
      console.log('Starting memory db...')
      const db = await MongoMemoryReplSet.create({
        replSet: {
          count: 3,
          dbName: 'payloadmemory',
        },
      })

      await db.waitUntilRunning()

      global._mongoMemoryServer = db

      process.env.MONGODB_MEMORY_SERVER_URI = `${global._mongoMemoryServer.getUri()}&retryWrites=true`
      console.log('Started memory db')
    }
  } else if (process.env.PAYLOAD_DATABASE === 'postgres') {
    // Start PostgreSQL + PostGIS Docker container
    if (!global._postgresDockerStarted) {
      try {
        console.log('Auto-starting PostgreSQL + PostGIS container...')

        // Fast check: if container is running and healthy, exit immediately
        let containerRunning = false
        try {
          const result = execSync(
            'docker ps --filter name=payload_postgres_test --filter health=healthy --format "{{.Names}}"',
            {
              encoding: 'utf8',
              stdio: 'pipe',
            },
          ).trim()

          if (result === 'payload_postgres_test') {
            // Container is running and healthy - set env var and exit fast (< 100ms)
            process.env.POSTGRES_URL = 'postgres://devuser:devpassword@127.0.0.1:5433/mydb'
            global._postgresDockerStarted = true
            console.log('PostgreSQL container already running and healthy')
            return
          }
        } catch {
          // Container not running or not healthy, continue to start it
        }

        // Start the container using docker-compose
        console.log('Starting PostgreSQL + PostGIS container...')
        execSync('docker compose -f test/docker-compose.yml up -d postgres', { stdio: 'inherit' })

        // Wait for PostgreSQL to be ready with optimized timing
        console.log('Waiting for PostgreSQL to be ready...')
        let retries = 30
        while (retries > 0) {
          try {
            execSync('docker exec payload_postgres_test pg_isready -U devuser -d mydb', {
              stdio: 'ignore',
            })
            containerRunning = true
            break
          } catch {
            retries--
            if (retries === 0) {
              throw new Error('PostgreSQL container failed to start within timeout')
            }
            // Faster initial checks, then slower ones
            const delay = retries > 20 ? 300 : 1000
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }

        if (containerRunning) {
          process.env.POSTGRES_URL = 'postgres://devuser:devpassword@127.0.0.1:5433/mydb'
          global._postgresDockerStarted = true
          console.log('PostgreSQL + PostGIS container started successfully!')
        }
      } catch (error) {
        console.error(
          'Failed to start PostgreSQL container:',
          error instanceof Error ? error.message : error,
        )
        throw error
      }
    }
  }
}
