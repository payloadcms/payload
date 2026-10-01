import type { Config, Plugin } from '../config/types.js'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { sanitizeBranchingConfig } from './sanitizeBranchingConfig.js'
import {
  branchChangesCollectionSlug,
  branchesCollectionSlug,
  branchMergesCollectionSlug,
} from './types.js'
import { defaultBranchMergeValidation } from './validation.js'

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
    const multiTenantPlugin = (() => {}) as Plugin

    multiTenantPlugin.slug = '@payloadcms/plugin-multi-tenant'

    sanitizeBranchingConfig({
      branching: true,
      collections: [{ fields: [], slug: 'posts' }],
      plugins: [multiTenantPlugin],
    } as Config)

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[Payload] Content branching and @payloadcms/plugin-multi-tenant are enabled together. This combination is not supported and does not provide tenant isolation.',
    )
  })

  it('should not warn when the multi-tenant plugin is disabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const multiTenantPlugin = (() => {}) as Plugin

    multiTenantPlugin.slug = '@payloadcms/plugin-multi-tenant'
    multiTenantPlugin.options = { enabled: false }

    sanitizeBranchingConfig({
      branching: true,
      collections: [{ fields: [], slug: 'posts' }],
      plugins: [multiTenantPlugin],
    } as Config)

    expect(warn).not.toHaveBeenCalled()
  })

  it('should not warn when branching is disabled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const multiTenantPlugin = (() => {}) as Plugin

    multiTenantPlugin.slug = '@payloadcms/plugin-multi-tenant'

    sanitizeBranchingConfig({
      collections: [{ fields: [], slug: 'posts' }],
      plugins: [multiTenantPlugin],
    } as Config)

    expect(warn).not.toHaveBeenCalled()
  })

  it('should not mistake a custom tenant field for the multi-tenant plugin', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    sanitizeBranchingConfig({
      branching: true,
      collections: [
        {
          fields: [{ name: 'tenant', type: 'text' }],
          slug: 'posts',
        },
      ],
    } as Config)

    expect(warn).not.toHaveBeenCalled()
  })
})
