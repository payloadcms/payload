import type { Access } from '../config/types.js'
import type { SanitizedBranchingConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { defaultAccess } from '../auth/defaultAccess.js'
import { resolveBranchActionAccess } from './resolveBranchActionAccess.js'

const createBranchingConfig = (
  access?: SanitizedBranchingConfig['access'],
): SanitizedBranchingConfig =>
  ({
    access,
  }) as SanitizedBranchingConfig

const allowAccess: Access = () => true
const denyAccess: Access = () => false

describe('resolveBranchActionAccess', () => {
  it('should use mergeBranch when configured', () => {
    const branching = createBranchingConfig({
      mergeBranch: allowAccess,
      readBranch: denyAccess,
    })

    expect(resolveBranchActionAccess({ action: 'mergeBranch', branching })).toBe(allowAccess)
  })

  it('should fall back from mergeBranch to readBranch', () => {
    const branching = createBranchingConfig({ readBranch: allowAccess })

    expect(resolveBranchActionAccess({ action: 'mergeBranch', branching })).toBe(allowAccess)
  })

  it('should fall back from mergeBranch to defaultAccess', () => {
    const branching = createBranchingConfig()

    expect(resolveBranchActionAccess({ action: 'mergeBranch', branching })).toBe(defaultAccess)
  })

  it('should use discardBranch when configured', () => {
    const branching = createBranchingConfig({
      deleteBranch: denyAccess,
      discardBranch: allowAccess,
    })

    expect(resolveBranchActionAccess({ action: 'discardBranch', branching })).toBe(allowAccess)
  })

  it('should fall back from discardBranch to deleteBranch', () => {
    const branching = createBranchingConfig({ deleteBranch: allowAccess })

    expect(resolveBranchActionAccess({ action: 'discardBranch', branching })).toBe(allowAccess)
  })

  it('should fall back from discardBranch to defaultAccess', () => {
    const branching = createBranchingConfig()

    expect(resolveBranchActionAccess({ action: 'discardBranch', branching })).toBe(defaultAccess)
  })
})
