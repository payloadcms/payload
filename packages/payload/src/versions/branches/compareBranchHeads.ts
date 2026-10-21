import type {
  BranchContentScope,
  BranchHeadState,
  BranchHeadToken,
  BranchVersionReference,
} from './types.js'

export const areBranchScopesEqual = ({
  left,
  right,
}: {
  left: BranchContentScope
  right: BranchContentScope
}): boolean => {
  return (
    left.type === right.type &&
    (left.type !== 'locale' || (right.type === 'locale' && left.locale === right.locale))
  )
}

export const areBranchVersionsEqual = ({
  left,
  right,
}: {
  left: BranchVersionReference | null
  right: BranchVersionReference | null
}): boolean => {
  if (left === null || right === null) {
    return left === right
  }

  return left.id === right.id && left.generation === right.generation
}

export const areBranchHeadStatesEqual = ({
  left,
  right,
}: {
  left: BranchHeadState | null
  right: BranchHeadState | null
}): boolean => {
  if (left === null || right === null) {
    return left === right
  }

  if (left.type === 'withdrawn' || right.type === 'withdrawn') {
    return left.type === right.type
  }

  return (
    areBranchVersionsEqual({ left: left.version, right: right.version }) &&
    areBranchVersionsEqual({ left: left.structure, right: right.structure })
  )
}

export const areBranchHeadTokensEqual = ({
  left,
  right,
}: {
  left: BranchHeadToken
  right: BranchHeadToken
}): boolean => {
  return (
    left.branchID === right.branchID &&
    areBranchScopesEqual({ left: left.scope, right: right.scope }) &&
    left.generation === right.generation &&
    areBranchHeadStatesEqual({ left: left.state, right: right.state })
  )
}

/** A read set is unordered, but every branch/scope must occur exactly once. */
export const isBranchHeadReadSetCurrent = ({
  actual,
  expected,
}: {
  actual: readonly BranchHeadToken[]
  expected: readonly BranchHeadToken[]
}): boolean => {
  if (
    actual.length !== expected.length ||
    hasDuplicateHeads({ tokens: actual }) ||
    hasDuplicateHeads({ tokens: expected })
  ) {
    return false
  }

  return expected.every((token) =>
    actual.some((candidate) => areBranchHeadTokensEqual({ left: token, right: candidate })),
  )
}

const hasDuplicateHeads = ({ tokens }: { tokens: readonly BranchHeadToken[] }): boolean => {
  return tokens.some((token, index) =>
    tokens
      .slice(index + 1)
      .some(
        (candidate) =>
          token.branchID === candidate.branchID &&
          areBranchScopesEqual({ left: token.scope, right: candidate.scope }),
      ),
  )
}
