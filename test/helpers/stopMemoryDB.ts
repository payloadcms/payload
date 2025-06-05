/* eslint-disable no-restricted-exports */

export default async () => {
  try {
    if (global._mongoMemoryServer) {
      console.log('Stopping memorydb...')
      await global._mongoMemoryServer.stop()
      console.log('Stopped memorydb')
    }
  } catch (error) {
    console.error('Error stopping memorydb:', error)
  }

  process.exit(0)
}
