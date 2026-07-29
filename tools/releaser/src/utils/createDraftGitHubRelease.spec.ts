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
        jsonResponse([
          { id: 42, draft: true, tag_name: 'v4.0.0-canary.10', html_url: 'https://gh/existing' },
        ]),
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

  it('should refuse to overwrite an already-published release', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 7, draft: false, tag_name: 'v4.0.0-canary.10', html_url: 'https://gh/published' },
        ]),
      )

    await expect(
      createDraftGitHubRelease({
        branch: 'main',
        tag: 'v4.0.0-canary.10',
        releaseNotes: 'notes',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/already-published/)

    // Only the list call happened — no PATCH/POST was attempted.
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('should scan only the newest page and treat a not-found tag as new (with a warning)', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      draft: true,
      tag_name: `v4.0.0-canary.${i}`,
    }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(fullPage)) // page 1: 100 items, target absent
      .mockResolvedValueOnce(jsonResponse({ html_url: 'https://gh/new' })) // POST (treated as new)

    const { releaseUrl } = await createDraftGitHubRelease({
      branch: 'main',
      tag: 'v4.0.0-beta.0',
      releaseNotes: 'notes',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(releaseUrl).toBe('https://gh/new')
    // Only the first page is listed — no page-2 fetch — then a POST.
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[0]![0]).toContain('page=1')
    expect(fetchImpl.mock.calls.at(-1)![1].method).toBe('POST')
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })
})
