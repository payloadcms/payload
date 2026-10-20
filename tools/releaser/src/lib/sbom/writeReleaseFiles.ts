import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export type ReleaseAsset = {
  /** File name in the output dir, also the release asset name */
  file: string
  /** Release asset label shown on GitHub */
  label: string
}

export const CHECKSUMS_ASSET: ReleaseAsset = { file: 'SHA256SUMS', label: 'SHA-256 checksums' }

export const MANIFEST_FILE = 'sbom-manifest.json'

/**
 * Writes `SHA256SUMS` (`sha256sum -c` format) over the given files and a manifest
 * that lists every asset to upload, with `SHA256SUMS` last.
 */
export const writeReleaseFiles = ({
  assets,
  outDir,
}: {
  assets: ReleaseAsset[]
  outDir: string
}): { checksumsPath: string; manifestPath: string } => {
  const sortedAssets = [...assets].sort(compareByFile)

  const checksums = sortedAssets
    .map(({ file }) => `${hashFile(path.join(outDir, file))}  ${file}\n`)
    .join('')
  const checksumsPath = path.join(outDir, CHECKSUMS_ASSET.file)
  fs.writeFileSync(checksumsPath, checksums)

  const manifestPath = path.join(outDir, MANIFEST_FILE)
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ assets: [...sortedAssets, CHECKSUMS_ASSET] }, null, 2) + '\n',
  )

  return { checksumsPath, manifestPath }
}

// Code-unit order, so the output does not depend on the runner locale.
const compareByFile = (a: ReleaseAsset, b: ReleaseAsset): number => {
  if (a.file === b.file) {
    return 0
  }
  return a.file < b.file ? -1 : 1
}

const hashFile = (filePath: string): string =>
  crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
