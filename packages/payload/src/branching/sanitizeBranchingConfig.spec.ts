import type { Config, Plugin } from '../config/types.js'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { sanitizeBranchingConfig } from './sanitizeBranchingConfig.js'
import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from './types.js'
import { defaultBranchMergeValidation } from './validation.js'

const createMultiTenantPlugin = ({ isEnabled }: { isEnabled?: boolean } = {}): Plugin => {
  const multiTenantPlugin = (() => {}) as Plugin

  multiTenantPlugin.slug = '@payloadcms/plugin-multi-tenant'

  if (typeof isEnabled === 'boolean') {
    multiTenantPlugin.options = { enabled: isEnabled }
  }

  return multiTenantPlugin
}

describe('sanitizeBranchingConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('should warn when branching and the multi-tenant plugin are enabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    sanitizeBranchingConfig({
      branching: true,
      collections: [{ fields: [], slug: 'posts' }],
      plugins: [createMultiTenantPlugin()],
    } as Config)

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[Payload] Content branching and @payloadcms/plugin-multi-tenant are enabled together. This combination is not supported and does not provide tenant isolation.',
    )
  })

  it.each([
    [
      'the multi-tenant plugin is disabled',
      {
        branching: true,
        collections: [{ fields: [], slug: 'posts' }],
        plugins: [createMultiTenantPlugin({ isEnabled: false })],
      },
    ],
    [
      'branching is disabled',
      {
        collections: [{ fields: [], slug: 'posts' }],
        plugins: [createMultiTenantPlugin()],
      },
    ],
    [
      'a collection has a custom tenant field',
      {
        branching: true,
        collections: [
          {
            fields: [{ name: 'tenant', type: 'text' }],
            slug: 'posts',
          },
        ],
      },
    ],
  ] as const)('should not warn when %s', (_case, config) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    sanitizeBranchingConfig(config as Config)

    expect(warn).not.toHaveBeenCalled()
  })
})
