import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { writeReleaseFiles } from './writeReleaseFiles.js'

const sha256 = (content: string): string =>
  crypto.createHash('sha256').update(content).digest('hex')

describe('writeReleaseFiles', () => {
  let outDir: string

  beforeEach(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-files-'))
    fs.writeFileSync(path.join(outDir, 'b.cdx.json'), 'b')
    fs.writeFileSync(path.join(outDir, 'a.cdx.json'), 'a')
  })

  afterEach(() => {
    fs.rmSync(outDir, { force: true, recursive: true })
  })

  const assets = [
    { file: 'b.cdx.json', label: 'b (CycloneDX 1.6)' },
    { file: 'a.cdx.json', label: 'a (CycloneDX 1.6)' },
  ]

  it('should write sha256sum -c lines sorted by file name', () => {
    const { checksumsPath } = writeReleaseFiles({ assets, outDir })

    expect(checksumsPath).toBe(path.join(outDir, 'SHA256SUMS'))
    expect(fs.readFileSync(checksumsPath, 'utf8')).toBe(
      `${sha256('a')}  a.cdx.json\n${sha256('b')}  b.cdx.json\n`,
    )
  })

  it('should write the manifest sorted by file name with SHA256SUMS last', () => {
    const { manifestPath } = writeReleaseFiles({ assets, outDir })

    expect(manifestPath).toBe(path.join(outDir, 'sbom-manifest.json'))
    expect(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))).toEqual({
      assets: [
        { file: 'a.cdx.json', label: 'a (CycloneDX 1.6)' },
        { file: 'b.cdx.json', label: 'b (CycloneDX 1.6)' },
        { file: 'SHA256SUMS', label: 'SHA-256 checksums' },
      ],
    })
  })
})
