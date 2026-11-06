import crypto from 'crypto'
import execa from 'execa'
import fs from 'fs'
import path from 'path'

/**
 * Folder inside `outDir` that holds the SBOMs, and the zip's top-level folder.
 * `.github/scripts/sbom/attach-sboms.mjs` derives the same name from the release tag.
 */
export const toBundleName = ({ version }: { version: string }): string => `payload-sboms-${version}`

/**
 * Writes `SHA256SUMS` (`sha256sum -c` format) over `files` in the bundle folder,
 * then zips that folder next to it.
 */
export const writeReleaseBundle = async ({
  files,
  outDir,
  version,
}: {
  /** File names inside the bundle folder */
  files: string[]
  outDir: string
  version: string
}): Promise<{ zipPath: string }> => {
  const bundleName = toBundleName({ version })
  const bundleDir = path.join(outDir, bundleName)

  const checksums = [...files]
    .sort(compareCodeUnits)
    .map((file) => `${hashFile(path.join(bundleDir, file))}  ${file}\n`)
    .join('')
  fs.writeFileSync(path.join(bundleDir, 'SHA256SUMS'), checksums)

  const zipFile = `${bundleName}.zip`
  // -X drops extra file attributes (owner ids, macOS metadata) the customer does not need.
  await execa('zip', ['-q', '-r', '-X', zipFile, bundleName], { cwd: outDir })

  return { zipPath: path.join(outDir, zipFile) }
}

// Code-unit order, so the output does not depend on the runner locale.
const compareCodeUnits = (a: string, b: string): number => {
  if (a === b) {
    return 0
  }
  return a < b ? -1 : 1
}

const hashFile = (filePath: string): string =>
  crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
