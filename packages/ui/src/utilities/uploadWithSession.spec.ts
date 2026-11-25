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

/** Sends two segments at a time, so a third one waits in the queue. */
const parallelSession = {
  ...session,
  transfer: {
    concurrency: 2,
    segments: [
      { end: 2, number: 1, start: 0 },
      { end: 3, number: 2, start: 2 },
      { end: 4, number: 3, start: 3 },
    ],
  },
} as unknown as ClientUploadSession

/**
 * Storage rejects segment 1 for good. The other segments stay open until the test responds, like
 * a slow upload that is still sending when segment 1 fails. They ignore aborts, so a test can
 * respond to one after the failure.
 */
const stubFailingSegment = () => {
  const openSegments = new Map<
    number,
    { respond: (response: Response) => void; signal?: AbortSignal | null }
  >()

  const fetch = vi.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/instructions')) {
      return Promise.resolve(
        json({
          body: {
            requests: parallelSession.transfer.segments.map(({ number }) => ({
              method: 'PUT',
              number,
              url: `https://storage/${number}`,
            })),
            session: parallelSession,
          },
        }),
      )
    }

    const number = Number(url.split('/').pop())

    if (number === 1) {
      return Promise.resolve(new Response(null, { status: 400 }))
    }

    return new Promise<Response>((respond) => {
      openSegments.set(number, { respond, signal: init?.signal })
    })
  })

  vi.stubGlobal('fetch', fetch)

  return { fetch, openSegments }
}

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

  it('should stop reporting progress once a segment fails', async () => {
    const { openSegments } = stubFailingSegment()
    const onProgress = vi.fn()

    const result = await resumeUploadSession({
      ...requestArgs,
      file,
      onProgress,
      session: parallelSession,
    }).catch((err: unknown) => err)

    openSegments.get(2)?.respond(new Response(null, { status: 200 }))
    await vi.advanceTimersByTimeAsync(0)

    expect(result).toMatchObject({ message: 'Upload failed with status 400' })
    expect(onProgress).not.toHaveBeenCalled()
  })

  it('should not send the remaining segments once a segment fails', async () => {
    const { fetch, openSegments } = stubFailingSegment()

    await resumeUploadSession({ ...requestArgs, file, session: parallelSession }).catch(() => {})

    openSegments.get(2)?.respond(new Response(null, { status: 200 }))
    await vi.advanceTimersByTimeAsync(0)

    expect(fetch).not.toHaveBeenCalledWith('https://storage/3', expect.anything())
  })

  it('should cancel segments still sending once a segment fails', async () => {
    const { openSegments } = stubFailingSegment()

    await resumeUploadSession({ ...requestArgs, file, session: parallelSession }).catch(() => {})

    expect(openSegments.get(2)?.signal?.aborted).toBe(true)
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
