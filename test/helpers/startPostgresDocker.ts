import { execSync } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

declare global {
  // Add the custom property to the NodeJS global type
  // eslint-disable-next-line no-var
  var _postgresDockerStarted: boolean | undefined
}

/**
 * Start PostgreSQL + PostGIS container automatically for tests
 * Similar to MongoDB Memory Server but using Docker Compose
 */
// eslint-disable-next-line no-restricted-exports
export default async () => {
  // Set environment variables for test mode
  ;(process.env as any).NODE_ENV = process.env.NODE_ENV || 'test'
  process.env.PAYLOAD_DROP_DATABASE = process.env.PAYLOAD_DROP_DATABASE || 'true'
  process.env.NODE_OPTIONS = process.env.NODE_OPTIONS || '--no-deprecation'
  process.env.DISABLE_PAYLOAD_HMR = process.env.DISABLE_PAYLOAD_HMR || 'true'

  if (process.env.PAYLOAD_DATABASE === 'postgres' && !global._postgresDockerStarted) {
    console.log('Starting PostgreSQL + PostGIS container...')

    try {
      // Check if Docker is available
      execSync('docker --version', { stdio: 'ignore' })

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

        // If we get here, container exists but might not be healthy
        execSync('docker inspect payload_postgres_test', { stdio: 'ignore' })
        console.log('PostgreSQL container exists, checking health...')
        containerRunning = true
      } catch {
        console.log('Starting new PostgreSQL container...')
        // Start the PostgreSQL service using Docker Compose
        execSync('docker compose -f test/docker-compose.yml up -d postgres', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })

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
            // Faster checks initially, then slower - most containers are ready in 2-3 seconds
            const delay = retries > 20 ? 300 : retries > 10 ? 500 : 1000
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      // Set the connection URL for Payload
      process.env.POSTGRES_URL = 'postgres://devuser:devpassword@127.0.0.1:5433/mydb'
      global._postgresDockerStarted = true

      console.log('PostgreSQL + PostGIS container ready!')
    } catch (error) {
      console.error('Failed to start PostgreSQL container:', error)
      console.log('Falling back to manual configuration. Please ensure PostgreSQL is running.')
    }
  }
}
