import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(here, '..', '..')

describe('runbook packaging', () => {
  it('ships the hand-written runbook in src', () => {
    expect(existsSync(join(here, '..', 'runbook', 'payload-v4-upgrade.md'))).toBe(true)
  })

  it('copy script places the runbook and v4.mdx into the target runbook dir', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'codemod-pkg-'))

    // Redirect the copy script's dist target so this test never touches the real dist/.
    execFileSync('node', [join(pkgDir, 'scripts', 'copy-migration-guide.mjs')], {
      env: { ...process.env, CODEMOD_DIST_DIR: scratch },
    })

    expect(existsSync(join(scratch, 'runbook', 'payload-v4-upgrade.md'))).toBe(true)
    expect(existsSync(join(scratch, 'runbook', 'v4.mdx'))).toBe(true)
  })
})
