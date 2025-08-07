import { execSync } from 'child_process'

/**
 * Unified database teardown for Jest global teardown
 * Stops the appropriate database based on what was started
 */
export default () => {
  if (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongodb') {
    // Stop MongoDB Memory Server
    if (global._mongoMemoryServer) {
      global._mongoMemoryServer
        .stop()
        .then(() => {
          console.log('Stopped memory db')
        })
        .catch((e) => {
          console.error('Error stopping memory db:', e)
        })
    }
  } else if (process.env.PAYLOAD_DATABASE === 'postgres') {
    // For PostgreSQL, we keep the container running for reuse
    // This avoids connection termination errors and improves performance
    // Use manual scripts like `pnpm docker:postgres:stop` to stop when needed
    console.log(
      'PostgreSQL container kept running for reuse (use `pnpm docker:postgres:stop` to stop)',
    )
  }
}
