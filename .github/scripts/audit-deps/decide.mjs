const BOT_LOGIN = 'github-actions[bot]'

/**
 * Picks the next pipeline step. Closing a bot PR without merging means "ignore this
 * advisory set", so a rejected PR only blocks recreation while the fixable set is unchanged.
 */
export function decideNextStep({ fixable, isDefaultInputs, openPr, rejectedPr }) {
  const hasFixable = fixable.length > 0

  if (!isDefaultInputs) {
    return hasFixable ? 'dry-run' : 'none'
  }

  if (!hasFixable) {
    return openPr ? 'close' : 'none'
  }

  if (!openPr) {
    return isSameSet({ advisories: rejectedPr?.advisories, fixable }) ? 'skip' : 'create'
  }

  if (isSameSet({ advisories: openPr.advisories, fixable })) {
    return 'skip'
  }

  return openPr.hasForeignCommits ? 'blocked' : 'update'
}

export function hasForeignCommits({ commits }) {
  return commits.some((commit) => commit.author?.login !== BOT_LOGIN)
}

// A missing marker (null) never matches, so edited PR bodies are regenerated, not skipped.
function isSameSet({ advisories, fixable }) {
  if (!advisories) {
    return false
  }

  const expected = [...new Set(fixable)].sort()
  const actual = [...new Set(advisories)].sort()

  return expected.length === actual.length && expected.every((value, i) => value === actual[i])
}
