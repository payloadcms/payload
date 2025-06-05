import { spawn } from 'child_process'

try {
  if (global._mongoMemoryServer) {
    // Spawn a detached process to stop the memory server.
    // We need to stop the memory server in a seperate process, after the jest process has exited.
    // This ensures that Cronjobs that may be started by payload (in the jest process) are stopped.
    // Otherwise, we may shut down the memory server while the cronjob is still running, which can lead to mongo
    // connection errors (if the cronjob tries to perform a db operation in between mongo shutting down and jest exiting) that are reported as failed tests.
    const stopScript = `
      (async () => {
        // Wait 300ms to ensure the jest process has exited
        await new Promise(resolve => setTimeout(resolve, 300));
        try {
          if (global._mongoMemoryServer) {
            await global._mongoMemoryServer.stop();
            console.log('Stopped memorydb');
          }
        } catch (error) {
          console.error('Error stopping memorydb:', error);
        }
        process.exit(0);
      })();
    `

    const child = spawn(process.execPath, ['-e', stopScript], {
      detached: true,
      stdio: 'ignore',
    })
    // Unreference the child process so it can run independently and so that jest can exit cleanly without open handles warnings
    child.unref()
    console.log('Spawned detached process to stop memorydb')
  }
} catch (error) {
  console.error('Error stopping memorydb:', error)
}

process.exit(0)
