import crypto from 'crypto'
import execa from 'execa'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { toBundleName, writeReleaseBundle } from './writeReleaseBundle.js'

const VERSION = '4.0.0-beta.3'

const sha256 = (content: string): string =>
  crypto.createHash('sha256').update(content).digest('hex')

describe('toBundleName', () => {
  it('should name the bundle after the release version', () => {
    expect(toBundleName({ version: VERSION })).toBe('payload-sboms-4.0.0-beta.3')
  })
})

describe('writeReleaseBundle', () => {
  let outDir: string
  let bundleDir: string

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-bundle-'))
    bundleDir = path.join(outDir, toBundleName({ version: VERSION }))
    fs.mkdirSync(bundleDir)
    fs.writeFileSync(path.join(bundleDir, 'b.cdx.json'), 'b')
    fs.writeFileSync(path.join(bundleDir, 'a.cdx.json'), 'a')
  })

  afterEach(() => {
    fs.rmSync(outDir, { force: true, recursive: true })
  })

  const files = ['b.cdx.json', 'a.cdx.json']

  it('should write sha256sum -c lines sorted by file name into the bundle dir', async () => {
    await writeReleaseBundle({ files, outDir, version: VERSION })

    expect(fs.readFileSync(path.join(bundleDir, 'SHA256SUMS'), 'utf8')).toBe(
      `${sha256('a')}  a.cdx.json\n${sha256('b')}  b.cdx.json\n`,
    )
  })

  it('should zip the SBOMs and SHA256SUMS under one top-level folder', async () => {
    const { zipPath } = await writeReleaseBundle({ files, outDir, version: VERSION })

    const { stdout } = await execa('unzip', ['-Z1', zipPath])

    expect(zipPath).toBe(path.join(outDir, 'payload-sboms-4.0.0-beta.3.zip'))
    expect(stdout.split('\n').sort()).toEqual([
      'payload-sboms-4.0.0-beta.3/',
      'payload-sboms-4.0.0-beta.3/SHA256SUMS',
      'payload-sboms-4.0.0-beta.3/a.cdx.json',
      'payload-sboms-4.0.0-beta.3/b.cdx.json',
    ])
  })

  it('should write only the zip next to the bundle folder', async () => {
    await writeReleaseBundle({ files, outDir, version: VERSION })

    expect(fs.readdirSync(outDir).sort()).toEqual([
      'payload-sboms-4.0.0-beta.3',
      'payload-sboms-4.0.0-beta.3.zip',
    ])
  })
})
