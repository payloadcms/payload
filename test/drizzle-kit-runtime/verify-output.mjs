import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const kitPackage = /(?:^|[/\\])drizzle-kit(?:[/\\]|@|-[a-f0-9]+(?:[/\\]|$))/
const hashedImport = /drizzle-kit-[a-f0-9]+\/api/
assert.ok(existsSync('.open-next/worker.js'), 'Build the Worker before validating its output')

for (const adapter of ['d1', 'sqlite']) {
  assert.ok(
    existsSync(`.next/server/app/api/${adapter}/route.js.nft.json`),
    `Missing ${adapter} route trace`,
  )
}

for (const file of readdirSync('.next/server', { recursive: true })) {
  if (file.endsWith('.nft.json')) {
    const trace = JSON.parse(readFileSync(path.join('.next/server', file), 'utf8'))
    assert.deepEqual(
      trace.files.filter((entry) => kitPackage.test(entry)),
      [],
      file,
    )
  }
}

for (const file of readdirSync('.open-next', { recursive: true })) {
  assert.ok(!kitPackage.test(file), `Tooling package in Worker output: ${file}`)
  if (
    (file.endsWith('.js') || file.endsWith('.mjs')) &&
    statSync(path.join('.open-next', file)).isFile()
  ) {
    assert.ok(
      !hashedImport.test(readFileSync(path.join('.open-next', file), 'utf8')),
      `Hashed Drizzle Kit import in Worker output: ${file}`,
    )
  }
}

console.log('No Drizzle Kit package files or hashed imports in the traced Worker output')
