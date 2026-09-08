const isNonFastForward = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err)
  return /non-fast-forward|fetch first/i.test(message)
}

/**
 * Pushes HEAD:main and the release tag atomically. If main moved underneath us
 * (a merge raced the push), rebase onto the new main, recreate the tag at the
 * new HEAD, and retry — up to `maxRetries` times. Any non-fast-forward failure
 * that survives all retries is rethrown; any other failure is rethrown immediately.
 */
export const pushWithRebaseRetry = async ({
  dryRun = false,
  log = console.log,
  maxRetries = 3,
  run,
  tag,
}: {
  dryRun?: boolean
  log?: (message: string) => void
  maxRetries?: number
  run: (cmd: string) => void
  tag: string
  // eslint-disable-next-line @typescript-eslint/require-await -- async only to satisfy the Promise<void> contract; run() is synchronous by design
}): Promise<void> => {
  const pushCmd = `git push --atomic origin HEAD:main refs/tags/${tag}`

  if (maxRetries < 1) {
    throw new Error(`maxRetries must be at least 1, got ${maxRetries}`)
  }

  if (dryRun) {
    log(`[dry-run] ${pushCmd}`)
    return
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      run(pushCmd)
      return
    } catch (err: unknown) {
      if (!isNonFastForward(err)) {
        throw err
      }
      if (attempt === maxRetries) {
        throw new Error(`Failed to push ${tag} after ${maxRetries} attempts: ${String(err)}`)
      }
      log(`Non-fast-forward push rejected (attempt ${attempt}/${maxRetries}); rebasing...`)
      run('git pull --rebase origin main')
      run(`git tag -f -a ${tag} -m ${tag}`)
    }
  }
}
