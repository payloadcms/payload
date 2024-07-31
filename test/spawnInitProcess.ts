import child_process from 'node:child_process'

export async function spawnInitProcess(testSuiteArg: string) {
  // Now use tsx to execute initDevAndTest and wait until it console logs "Done". use child_process
  // 1. execute
  // 2. wait until console.log("Done")
  const child = child_process.spawn('tsx', ['test/initDevAndTest.ts', testSuiteArg])

  let done = false
  // Wait until the child process logs "Done"
  child.stdout.on('data', (data) => {
    console.log(data.toString())
    if (data.toString().includes('Done')) {
      child.kill()
      done = true
    }
  })

  // wait for done to be true
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (done) {
        clearInterval(interval)
        resolve(undefined)
      }
    }, 100)
  })
}
