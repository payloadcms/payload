import type { ExecSyncOptions } from 'child_process'

import { execSync } from 'child_process'

import { warning } from './log.js'

export function tryInitRepoAndCommit(args: { cwd: string }): void {
  const execOpts: ExecSyncOptions = { cwd: args.cwd, stdio: 'ignore' }
  try {
    // Check if git is available
    execSync('git -v', execOpts)

    // Do nothing if already in a git repo
    if (isGitRepo(execOpts)) {
      return
    }

    // Initialize
    execSync('git init', execOpts)
    if (!ensureHasDefaultBranch(execOpts)) {
      execSync('git checkout -b main', execOpts)
    }

    // Add and commit files
    execSync('git add -A', execOpts)
    execSync('git commit -m "feat: initial commit"', execOpts)
  } catch (_) {
    warning('Failed to initialize git repository.')
  }
}

function isGitRepo(opts: ExecSyncOptions): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', opts)
    return true
  } catch (_) {
    // Ignore errors
  }
  return false
}

function ensureHasDefaultBranch(opts: ExecSyncOptions): boolean {
  try {
    execSync(`git config init.defaultBranch`, opts)
    return true
  } catch (_) {
    // Ignore errros
  }
  return false
}
