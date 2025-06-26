/* eslint-disable no-restricted-exports */
import { spawn } from 'child_process'

/**
 * WARNING: This file MUST export a default function.
 * @link https://jestjs.io/docs/configuration#globalteardown-string
 */
export default function globalTeardown() {
  try {
    if (global._mongoMemoryServer) {
      const stopScript = `
        (async () => {
          await new Promise(resolve => setTimeout(resolve, 300));
          try {
            if (global._mongoMemoryServer) {
              await global._mongoMemoryServer.stop();
              console.log('Stopped memorydb');
            }
          } catch (error) {
            console.error('Error stopping memorydb:', error);
          }
        })();
      `

      const child = spawn(process.execPath, ['-e', stopScript], {
        detached: true,
        stdio: 'ignore',
      })

      child.unref()
      console.log('Spawned detached process to stop memorydb')
    }
  } catch (error) {
    console.error('Error in globalTeardown:', error)
  }
}
