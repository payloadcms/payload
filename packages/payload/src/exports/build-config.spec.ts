import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('payload/build-config', () => {
  it('should load in plain Node before TypeScript transforms or runtime dependencies are available', () => {
    const packageURL = new URL('../../', import.meta.url)
    const manifest = readFileSync(new URL('package.json', packageURL), 'utf8')
    const entrypoint = JSON.parse(manifest).exports['./build-config'].import
    const isolatedPackage = mkdtempSync(path.join(tmpdir(), 'payload-build-config-'))

    try {
      const entrypointPath = path.join(isolatedPackage, entrypoint)

      mkdirSync(path.dirname(entrypointPath), { recursive: true })
      copyFileSync(new URL(entrypoint, packageURL), entrypointPath)
      writeFileSync(path.join(isolatedPackage, 'package.json'), manifest)

      const output = execFileSync(
        process.execPath,
        [
          '--no-experimental-strip-types',
          '--input-type=module',
          '--eval',
          "import { devServerExternalPackages, serverExternalPackages } from 'payload/build-config'; console.log(JSON.stringify({ devServerExternalPackages, serverExternalPackages }))",
        ],
        {
          cwd: isolatedPackage,
          encoding: 'utf8',
          env: { ...process.env, NODE_OPTIONS: '' },
        },
      )
      const config = JSON.parse(output)

      expect(config.devServerExternalPackages).toContain('payload')
      expect(config.serverExternalPackages).toContain('graphql')
    } finally {
      rmSync(isolatedPackage, { force: true, recursive: true })
    }
  })
})
