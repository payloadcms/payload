import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'

// Exercise the bundled development path: unit tests cannot catch bundler rewrites of createRequire.
for (const bundler of ['--turbopack', '--webpack']) {
  const port = bundler === '--turbopack' ? 3222 : 3224
  const child = spawn(
    process.execPath,
    ['./node_modules/next/dist/bin/next', 'dev', bundler, '--port', String(port)],
    {
      cwd: import.meta.dirname,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  let output = ''
  const exited = new Promise((resolve) => child.once('exit', resolve))
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })

  try {
    const deadline = Date.now() + 60_000
    let response
    while (Date.now() < deadline) {
      assert.equal(child.exitCode, null, output)
      if (!output.includes('Ready in')) {
        await setTimeout(200)
        continue
      }
      try {
        response = await fetch(`http://localhost:${port}/api/tooling`, {
          signal: AbortSignal.timeout(30_000),
        })
        break
      } catch {
        await setTimeout(200)
      }
    }
    assert.ok(response, `Next did not start: ${output}`)
    assert.equal(response.status, 200, output)
    assert.deepEqual(await response.json(), { dialect: 'sqlite' })
    console.log(`${bundler}: bundled schema generation passed`)
  } finally {
    child.kill('SIGTERM')
    const forceStop = globalThis.setTimeout(() => child.kill('SIGKILL'), 5_000)
    await exited
    clearTimeout(forceStop)
  }
}
