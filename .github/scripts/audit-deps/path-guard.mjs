import { execFile } from 'node:child_process'
import { lstat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ROOT_ONLY_FILES = new Set(['pnpm-lock.yaml', 'pnpm-workspace.yaml'])
const WRITE_STATUS_CODES = new Set(['M', 'A', '?'])

/**
 * Returns a reason for every change that falls outside the dependency-manifest allowlist.
 * Fails closed: any status other than a modification or addition of a regular file is a reason.
 */
export function findDisallowedChanges({ changes }) {
  const reasons = []

  for (const { isSymlink, path, status } of changes) {
    if (!isAllowedPath({ path })) {
      reasons.push(`${path}: path not allowed`)
    }

    if (isSymlink) {
      reasons.push(`${path}: symlink`)
    }

    const statusReason = describeStatusProblem({ status })
    if (statusReason) {
      reasons.push(`${path}: ${statusReason}`)
    }
  }

  return reasons
}

/**
 * Lists tracked and untracked working tree changes. A rename yields the destination
 * (added) plus the source (deleted); a copy yields the destination plus its unchanged source.
 */
export async function listWorkingTreeChanges({ cwd }) {
  const { stdout } = await execFileAsync(
    'git',
    ['-c', 'core.quotePath=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all'],
    { cwd, maxBuffer: 64 * 1024 * 1024 },
  )

  const entries = parseStatusOutput({ stdout })

  return Promise.all(
    entries.map(async ({ path, status }) => ({
      isSymlink: await isSymlinkOnDisk({ cwd, path }),
      path,
      status,
    })),
  )
}

function isAllowedPath({ path }) {
  if (ROOT_ONLY_FILES.has(path)) {
    return true
  }

  return path.split('/').at(-1) === 'package.json'
}

function describeStatusProblem({ status }) {
  const codes = [...status].filter((code) => code !== ' ')

  if (codes.length === 0) {
    return 'empty status not allowed'
  }

  if (codes.includes('D')) {
    return 'deleted'
  }

  if (codes.every((code) => WRITE_STATUS_CODES.has(code))) {
    return null
  }

  return `status ${status.trim()} not allowed`
}

/**
 * Record layout of `--porcelain=v1 -z`: `XY <path>\0`, and for renames/copies
 * `XY <destination>\0<source>\0`. Paths are raw, never quoted.
 */
function parseStatusOutput({ stdout }) {
  const tokens = stdout.split('\0')
  const entries = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) {
      continue
    }

    const status = token.slice(0, 2)
    const path = token.slice(3)
    const isRenameOrCopy = /[RC]/.test(status)

    if (!isRenameOrCopy) {
      entries.push({ path, status })
      continue
    }

    const sourcePath = tokens[index + 1] ?? ''
    index += 1

    entries.push({ path, status: status.replace(/[RC]/g, 'A') })
    entries.push({ path: sourcePath, status: status.includes('R') ? 'D' : 'M' })
  }

  return entries
}

async function isSymlinkOnDisk({ cwd, path }) {
  try {
    const stats = await lstat(join(cwd, path))
    return stats.isSymbolicLink()
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false
    }
    throw error
  }
}
