import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { isPerformanceSourcePath } from './sourceDigest.mjs'

/**
 * Unrelated user notes may be dirty; every byte hashed for timing must come from the pinned commit.
 * @param {{ changedPaths: string[], expectedHead?: string, head: string, sourcePaths: string[], trackedPaths: string[] }} args
 */
export const validatePerformanceGitState = ({
  changedPaths,
  expectedHead,
  head,
  sourcePaths,
  trackedPaths,
}) => {
  if (expectedHead && head !== expectedHead)
    throw new Error('Performance Git HEAD changed from the pinned measurement commit.')
  const tracked = new Set(trackedPaths)
  const changed = new Set(changedPaths)
  const invalid = [
    ...new Set([
      ...sourcePaths.filter((path) => !tracked.has(path) || changed.has(path)),
      ...changedPaths.filter((path) => isPerformanceSourcePath({ path })),
    ]),
  ]
  if (invalid.length)
    throw new Error(
      `Performance source is untracked or changed from the measurement commit: ${invalid.slice(0, 5).join(', ')}`,
    )
}

/** @param {{ expectedHead?: string, referenceHead?: string, requireTrackedSource?: boolean, sourcePaths?: string[] }} [args] */
export const readPerformanceGitState = ({
  expectedHead,
  referenceHead,
  requireTrackedSource = false,
  sourcePaths = [],
} = {}) => {
  const options = {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)),
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    maxBuffer: 16 * 1024 * 1024,
  }
  const git = (args) => execFileSync('git', args, options).trim()
  const head = git(['rev-parse', 'HEAD'])
  if (requireTrackedSource) {
    const trackedPaths = git(
      referenceHead ? ['ls-tree', '-r', '-z', '--name-only', referenceHead] : ['ls-files', '-z'],
    ).split('\0')
    const changedPaths = git([
      'diff',
      '--no-renames',
      '--name-only',
      '-z',
      referenceHead ?? 'HEAD',
      '--',
    ]).split('\0')
    validatePerformanceGitState({ changedPaths, expectedHead, head, sourcePaths, trackedPaths })
  }
  return {
    head,
    isDirty: git(['status', '--porcelain', '--untracked-files=normal']).length > 0,
  }
}
