import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DevServer } from '../__helpers/shared/devServer.js'

import { test } from '../__helpers/int/vitest.js'
import { startDevServer } from '../__helpers/shared/devServer.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')
const suiteName = path.basename(dirname)

const generatedSources = [
  path.resolve(repoRoot, 'app-tanstack/tsconfig.json'),
  path.resolve(repoRoot, 'test/app-tanstack/routeTree.gen.ts'),
]
const originalSources = new Map(
  generatedSources.map((filePath) => [filePath, fs.readFileSync(filePath, 'utf8')]),
)

const DEV_SERVER_TIMEOUT = 5 * 60 * 1000

test.suite('TanStack server adapter', { db: 'mongo' }, () => {
  let devServer: DevServer

  test.beforeAll(async () => {
    devServer = await startDevServer({
      framework: 'tanstack-start',
      readyPath: '/api/set-two-cookies',
      suite: suiteName,
      timeout: DEV_SERVER_TIMEOUT - 30000,
    })
  }, DEV_SERVER_TIMEOUT)

  test.afterAll(async () => {
    await devServer?.stop()

    for (const [filePath, source] of originalSources) {
      fs.writeFileSync(filePath, source)
    }
  }, DEV_SERVER_TIMEOUT)

  test('should preserve multiple cookies in one response', async () => {
    const response = await fetch(`${devServer.serverURL}/api/set-two-cookies`)

    assert.equal(response.status, 200)
    assert.deepEqual(response.headers.getSetCookie(), [
      'first-cookie=first-value; Path=/',
      'second-cookie=second-value; Path=/',
    ])
  })
})
