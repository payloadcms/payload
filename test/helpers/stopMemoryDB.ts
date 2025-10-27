/**
 * WARNING: This file MUST export a default function.
 * @link https://jestjs.io/docs/configuration#globalteardown-string
 */
export default async function globalTeardown() {
  try {
    if (global._mongoMemoryServer) {
      try {
        await global._mongoMemoryServer.stop()
        console.log('Stopped memorydb')
      } catch (error) {
        console.error('Error stopping memorydb:', error)
      }
    }
  } catch (error) {
    console.error('Error in globalTeardown:', error)
  }
}
