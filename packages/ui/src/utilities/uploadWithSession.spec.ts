import type { ClientUploadSession } from 'payload'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { cancelUploadSession, resumeUploadSession } from './uploadWithSession.js'

const requestArgs = { apiRoute: '/api', serverURL: '' }

const file = new File(['data'], 'video.mp4', { lastModified: 1, type: 'video/mp4' })

const session = {
  id: 'session',
  completedSegments: [],
  file: { filename: 'video.mp4', lastModified: 1, mimeType: 'video/mp4', size: 4 },
  transfer: { concurrency: 1, segments: [{ end: 4, number: 1, start: 0 }] },
} as unknown as ClientUploadSession

const json = ({ body, status = 200 }: { body: unknown; status?: number }) =>
  new Response(JSON.stringify(body), { status })

describe('uploadWithSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should wait before requesting new segment URLs after a throttled window', async () => {
    let instructionRequests = 0

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.endsWith('/instructions')) {
          instructionRequests++

          return Promise.resolve(
            json({
              body: { requests: [{ method: 'PUT', number: 1, url: 'https://storage/1' }], session },
            }),
          )
        }

        return Promise.resolve(new Response(null, { status: 503 }))
      }),
    )

    const result = resumeUploadSession({ ...requestArgs, file, retries: 1, session }).catch(
      (err: unknown) => err,
    )

    await vi.advanceTimersByTimeAsync(0)

    expect(instructionRequests).toBe(1)

    await vi.advanceTimersByTimeAsync(1000)

    expect(instructionRequests).toBe(2)
    expect(await result).toMatchObject({ code: 'storageRejectedSegments' })
  })

  it('should retry a cancel while another request holds the session', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ body: { errors: [{ message: 'Busy' }] }, status: 409 }))
      .mockResolvedValueOnce(json({ body: { ...session, status: 'cancelled' } }))

    vi.stubGlobal('fetch', fetch)

    const cancelled = cancelUploadSession({ id: session.id, ...requestArgs })

    await vi.advanceTimersByTimeAsync(1000)

    await expect(cancelled).resolves.toMatchObject({ status: 'cancelled' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('should not retry a cancel the server refused for another reason', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(json({ body: { errors: [{ message: 'Not Found' }] }, status: 404 }))

    vi.stubGlobal('fetch', fetch)

    await expect(cancelUploadSession({ id: session.id, ...requestArgs })).rejects.toThrow(
      'Not Found',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
