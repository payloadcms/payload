import { PROJECT_ROOT } from '@tools/constants'
import execa from 'execa'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)

/**
 * Points `tag` at `name@version` on the npm registry. Runs the npm pinned in this
 * package's devDependencies because OIDC trusted publishing needs npm >= 11.21.0 for
 * dist-tags, which is newer than the npm bundled with the CI Node version.
 */
export const addDistTag = async ({
  name,
  tag,
  version,
}: {
  name: string
  tag: string
  version: string
}): Promise<void> => {
  await execa(process.execPath, [resolveNpmCli(), 'dist-tag', 'add', `${name}@${version}`, tag], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  })
}

// npm's `exports` hides its bin, so resolve it relative to the package root.
function resolveNpmCli(): string {
  return path.join(path.dirname(require.resolve('npm/package.json')), 'bin', 'npm-cli.js')
}
