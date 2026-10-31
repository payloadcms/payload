import { describe, expect, it } from 'vitest'

import { getBranchURL } from './getBranchURL.js'

const currentURL = 'https://cms.example.com/admin/collections/posts?branch=campaign'

describe('getBranchURL', () => {
  it.each([
    ['/admin/collections/posts/123', '/admin/collections/posts/123?branch=campaign'],
    [
      '/admin/collections/posts?locale=fr#title',
      '/admin/collections/posts?locale=fr&branch=campaign#title',
    ],
    ['?page=2', '/admin/collections/posts?page=2&branch=campaign'],
    ['#title', '#title'],
    ['/admin/collections/posts?branch=other', '/admin/collections/posts?branch=other'],
    ['/admin/collections/posts?branch=main', '/admin/collections/posts?branch=main'],
    ['/api/posts', '/api/posts'],
    ['/administrator', '/administrator'],
    ['https://other.example.com/admin', 'https://other.example.com/admin'],
    ['mailto:editor@example.com', 'mailto:editor@example.com'],
    ['https://cms.example.com/admin', 'https://cms.example.com/admin?branch=campaign'],
  ])('should resolve %s to %s', (href, expected) => {
    expect(getBranchURL({ adminRoute: '/admin', branch: 'campaign', currentURL, href })).toBe(
      expected,
    )
  })

  it('should leave main destinations unparameterized', () => {
    expect(
      getBranchURL({
        adminRoute: '/admin',
        branch: 'main',
        currentURL,
        href: '/admin/collections/posts',
      }),
    ).toBe('/admin/collections/posts')
  })

  it('should preserve nested filters and encode branch slugs', () => {
    const result = getBranchURL({
      adminRoute: '/custom-admin/',
      branch: 'campaign & launch',
      currentURL,
      href: '/custom-admin/collections/posts?where[title][contains]=hello%20world&locale=fr#title',
    })
    const url = new URL(result, currentURL)

    expect(url.searchParams.get('where[title][contains]')).toBe('hello world')
    expect(url.searchParams.get('branch')).toBe('campaign & launch')
    expect(url.searchParams.get('locale')).toBe('fr')
    expect(url.hash).toBe('#title')
  })
})
