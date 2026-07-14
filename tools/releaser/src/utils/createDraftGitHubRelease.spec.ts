import { describe, expect, it, vi } from 'vitest'

import { createDraftGitHubRelease } from './createDraftGitHubRelease.js'

const jsonResponse = (body: unknown, ok = true): Response =>
  ({
    ok,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response

describe('createDraftGitHubRelease', () => {
  it('should POST a new release when none exists for the tag', async () => {
    const fetchImpl = vi
      .fn()
      // page 1 of GET /releases: empty list -> no existing release
      .mockResolvedValueOnce(jsonResponse([]))
      // POST /releases
      .mockResolvedValueOnce(jsonResponse({ html_url: 'https://gh/new' }))

    const { releaseUrl } = await createDraftGitHubRelease({
      branch: 'main',
      tag: 'v4.0.0-canary.10',
      releaseNotes: 'notes',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(releaseUrl).toBe('https://gh/new')
    const lastCall = fetchImpl.mock.calls.at(-1)!
    expect(lastCall[1].method).toBe('POST')
  })

  it('should PATCH an existing draft release found by tag_name', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([{ id: 42, tag_name: 'v4.0.0-canary.10', html_url: 'https://gh/existing' }]),
      )
      .mockResolvedValueOnce(jsonResponse({ html_url: 'https://gh/existing' }))

    const { releaseUrl } = await createDraftGitHubRelease({
      branch: 'main',
      tag: 'v4.0.0-canary.10',
      releaseNotes: 'notes',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(releaseUrl).toBe('https://gh/existing')
    const patchCall = fetchImpl.mock.calls.at(-1)!
    expect(patchCall[0]).toContain('/releases/42')
    expect(patchCall[1].method).toBe('PATCH')
  })

  it('should find a match on page 2 (pagination)', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      tag_name: `v4.0.0-canary.${i}`,
    }))
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(fullPage)) // page 1: 100 items, no match
      .mockResolvedValueOnce(jsonResponse([{ id: 999, tag_name: 'v4.0.0-beta.0' }])) // page 2: match
      .mockResolvedValueOnce(jsonResponse({ html_url: 'https://gh/p2' })) // PATCH

    const { releaseUrl } = await createDraftGitHubRelease({
      branch: 'main',
      tag: 'v4.0.0-beta.0',
      releaseNotes: 'notes',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(releaseUrl).toBe('https://gh/p2')
    const patchCall = fetchImpl.mock.calls.at(-1)!
    expect(patchCall[0]).toContain('/releases/999')
    expect(patchCall[1].method).toBe('PATCH')
  })
})
