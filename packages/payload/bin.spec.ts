import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const packageDir = path.dirname(fileURLToPath(import.meta.url))
const fixtures: string[] = []

afterEach(async () => {
  await Promise.all(
    fixtures.splice(0).map((fixture) => rm(fixture, { recursive: true, force: true })),
  )
})

describe('CLI transpilation', () => {
  it('should load TypeScript and built-ins without disabling native module hooks', async () => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'payload-cli-transpilation-'))

    fixtures.push(fixture)
    await mkdir(path.join(fixture, 'dist/bin'), { recursive: true })
    await symlink(path.join(packageDir, 'node_modules'), path.join(fixture, 'node_modules'), 'dir')
    await copyFile(path.join(packageDir, 'bin.js'), path.join(fixture, 'bin.js'))
    await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ type: 'module' }))
    await writeFile(
      path.join(fixture, 'before.mjs'),
      `import module from 'node:module'
globalThis.originalRegisterHooks = module.registerHooks
`,
    )
    await writeFile(
      path.join(fixture, 'dist/bin/index.js'),
      `export { bin } from './command.ts'
`,
    )
    await writeFile(
      path.join(fixture, 'dist/bin/command.ts'),
      `import { strictEqual } from 'node:assert'
import { createHash } from 'node:crypto'
import { createHash as bareCreateHash } from 'crypto'
import module from 'node:module'

export async function bin(): Promise<void> {
  strictEqual(createHash, bareCreateHash)
  strictEqual(module.registerHooks, globalThis.originalRegisterHooks)
  const { readFile } = await import('node:fs/promises')
  const { readFile: bareReadFile } = await import('fs/promises')
  strictEqual(readFile, bareReadFile)
  console.log('CLI_EVALUATED', createHash('sha256').update('payload').digest('hex'))
}
`,
    )

    const result = spawnSync(process.execPath, ['--import', './before.mjs', './bin.js'], {
      cwd: fixture,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '' },
      timeout: 10000,
    })

    expect(result.error).toBeUndefined()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('CLI_EVALUATED')
  })
})
