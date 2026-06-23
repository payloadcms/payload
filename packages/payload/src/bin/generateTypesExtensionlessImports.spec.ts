import execa from 'execa'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterEach, describe, expect, it } from 'vitest'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const repoRoot = path.resolve(dirname, '../../../../')
const fixtureDir = path.resolve(repoRoot, 'test/generate-types-extensionless')
const outputFile = path.resolve(fixtureDir, 'payload-types.ts')
const payloadBin = path.resolve(dirname, '../../bin.js')

describe('payload generate:types CLI', () => {
  afterEach(() => {
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile)
    }
  })

  it('should resolve extensionless collection imports from payload.config.ts', async () => {
    const { exitCode, stderr, stdout } = await execa(
      process.execPath,
      [payloadBin, 'generate:types'],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/payload',
          PAYLOAD_CONFIG_PATH: path.resolve(fixtureDir, 'payload.config.ts'),
          PAYLOAD_SECRET: 'test',
        },
        reject: false,
      },
    )

    expect(exitCode, [stderr, stdout].filter(Boolean).join('\n')).toBe(0)
    expect(fs.existsSync(outputFile)).toBe(true)

    const generated = fs.readFileSync(outputFile, 'utf8')
    expect(generated).toContain('export interface User')
  }, 60000)
})
