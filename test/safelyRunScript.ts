import { spawn } from 'child_process'
import path from 'path'

export let child

/**
 * Sometimes, running certain functions in certain scripts from the command line will cause the script to be terminated
 * with a "Detected unsettled top-level await" error. This often happens if that function imports the payload config.
 * It seems to be a bug in Node.js and I do not know how to properly fix it. As a workaround, this script automatically re-runs
 * the script if said function is not resolved within a certain time frame, and prevents the "Detected unsettled top-level await" error.
 */
export async function safelyRunScriptFunction(
  functionToRun: any,
  timeout: number = 4000,
  ...args: any[]
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      restartProcess(`runInit timed out after ${timeout / 1000} seconds`)
    }, timeout)

    functionToRun(...args)
      .then(() => {
        clearTimeout(timeoutId)
        resolve()
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        restartProcess(`runInit failed: ${error.message}`)
      })
  })
}

function restartProcess(reason: string) {
  console.warn(`Restarting process: ${reason}`)

  // Get the path to the current script
  const scriptPath = process.argv[1]
  const absoluteScriptPath = path.resolve(scriptPath)

  // Spawn a new process
  child = spawn('tsx', [absoluteScriptPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    // detached: true,
  })

  // Setup signal handlers to ensure child process exits correctly
  process.on('SIGINT', () => {
    child.kill('SIGINT') // Forward SIGINT to child process
    process.exit(0) // Exit the parent process
  })
  process.on('SIGTERM', () => {
    child.kill('SIGTERM') // Forward SIGTERM to child process
    process.exit(0) // Exit the parent process
  })
}
