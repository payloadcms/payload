import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeBranchingConfig } from './sanitizeBranchingConfig.js'
import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from './types.js'
import { defaultBranchMergeValidation } from './validation.js'

describe('sanitizeBranchingConfig', () => {
  it('should use the default merge validator when branching is enabled as true', () => {
    const config = {
      branching: true,
      collections: [{ fields: [], slug: 'posts' }],
    } as Config

    expect(sanitizeBranchingConfig(config).validate).toBe(defaultBranchMergeValidation)
  })

  it('should preserve a configured replacement merge validator', () => {
    const validate = async () => ({ errors: [], valid: true })
    const config = {
      branching: { validate },
      collections: [{ fields: [], slug: 'posts' }],
    } as Config

    expect(sanitizeBranchingConfig(config).validate).toBe(validate)
  })

  it('should reject an auth-enabled collection that opts into branching', () => {
    const config = {
      branching: true,
      collections: [
        {
          auth: true,
          branching: true,
          fields: [],
          slug: 'users',
        },
      ],
    } as Config

    expect(() => sanitizeBranchingConfig(config)).toThrow(
      'Collection "users" has authentication enabled and cannot be branched. Remove `branching: true` from it.',
    )
  })

  it.each([branchesCollectionSlug, branchChangesCollectionSlug, branchMergesCollectionSlug])(
    'should reject the internal %s collection when it opts into branching',
    (slug) => {
      const config = {
        branching: true,
        collections: [{ branching: true, fields: [], slug }],
      } as Config

      expect(() => sanitizeBranchingConfig(config)).toThrow(
        `Collection "${slug}" stores branch state and cannot itself be branched. Remove \`branching: true\` from it.`,
      )
    },
  )
})
