import child_process from 'node:child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export async function spawnInitProcess(testSuiteArg: string) {
  // Now use tsx to execute initDevAndTest and wait until it console logs "Done". use child_process
  // 1. execute
  // 2. wait until console.log("Done")
  const child = child_process.spawn(
    path.resolve(dirname, '..', 'node_modules/.bin/tsx'),
    ['test/initDevAndTest.ts', testSuiteArg],
    {
      stdio: 'pipe',
      cwd: path.resolve(dirname, '..'),
    },
  )

  let done = false
  // Wait until the child process logs "Done"
  child.stdout.on('data', (data) => {
    console.log('initDevAndTest data', data.toString())
    if (data.toString().includes('Done')) {
      child.kill()
      done = true
    }
  })

  // on error
  child.stderr.on('data', (data) => {
    console.error('initDevAndTest error', data.toString())
  })

  child.on('close', (code) => {
    console.log(`Child process closed with code ${code}`)
  })

  // wait for done to be true
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (done) {
        clearInterval(interval)
        resolve(undefined)
      }
    }, 100)
  })
}
