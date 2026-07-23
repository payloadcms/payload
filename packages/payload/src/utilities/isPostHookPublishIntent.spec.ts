import { describe, expect, it } from 'vitest'

import { isPostHookPublishIntent } from './isPostHookPublishIntent.js'

describe('isPostHookPublishIntent', () => {
  it.each([
    {
      args: {
        locale: 'en',
        publishAllLocales: true,
        status: 'draft',
      },
      expected: true,
      name: 'explicit publish-all over draft status',
    },
    {
      args: {
        locale: 'en',
        publishAllLocales: true,
        status: 'published',
        unpublishAllLocales: true,
      },
      expected: false,
      name: 'explicit unpublish-all over publish-all',
    },
    {
      args: {
        locale: 'en',
        publishAllLocales: false,
        status: 'published',
      },
      expected: true,
      name: 'flat published status',
    },
    {
      args: {
        locale: 'en',
        publishAllLocales: false,
        status: { en: 'published', es: 'draft' },
      },
      expected: true,
      name: 'published active localized status',
    },
    {
      args: {
        locale: 'en',
        publishAllLocales: false,
        status: { en: 'draft', es: 'published' },
      },
      expected: false,
      name: 'published inactive localized status',
    },
    {
      args: {
        locale: 'all',
        publishAllLocales: false,
        status: { en: 'draft', es: 'published' },
      },
      expected: true,
      name: 'published status in an all-locales candidate',
    },
    {
      args: {
        locale: 'en',
        publishAllLocales: false,
        status: 'draft',
      },
      expected: false,
      name: 'ordinary draft status',
    },
  ])('should resolve $name', ({ args, expected }) => {
    expect(isPostHookPublishIntent(args)).toBe(expected)
  })
})
