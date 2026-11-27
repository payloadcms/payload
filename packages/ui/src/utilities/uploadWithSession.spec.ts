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

type SegmentAttempt = {
  /** Bytes reported sent, in order, before the response. */
  progress?: number[]
  status: number
}

/**
 * Stands in for the XHR that sends segments. Each send plays the next scripted attempt: its
 * progress events, then its response status.
 */
const stubSegmentUploads = ({ attempts }: { attempts: SegmentAttempt[] }) => {
  const queue = [...attempts]

  class FakeXMLHttpRequest {
    onabort?: () => void
    onerror?: () => void
    onload?: () => void
    ontimeout?: () => void
    response: Blob | null = null
    responseType = ''
    status = 0
    statusText = ''
    upload: {
      onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void
    } = {}
    withCredentials = false

    abort() {
      this.onabort?.()
    }

    getAllResponseHeaders() {
      return ''
    }

    open() {}

    send(body: Blob) {
      const attempt = queue.shift() ?? { status: 200 }

      const progress = attempt.progress ?? []

      // Spaced like a real upload, so each event lands in its own animation frame.
      progress.forEach((loaded, index) => {
        setTimeout(
          () => this.upload.onprogress?.({ lengthComputable: true, loaded, total: body.size }),
          (index + 1) * 40,
        )
      })
      setTimeout(
        () => {
          this.status = attempt.status
          this.response = new Blob([])
          this.onload?.()
        },
        (progress.length + 1) * 40,
      )
    }

    setRequestHeader() {}
  }

  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest)
}

/** Answers the session API like a server with the given segment URLs and confirmed segments. */
const stubSessionAPI = ({
  completedAfterUpload,
  segmentNumbers,
}: {
  completedAfterUpload: number[]
  segmentNumbers: number[]
}) => {
  let instructionCalls = 0

  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.endsWith('/instructions')) {
        instructionCalls++
        const isFirst = instructionCalls === 1

        return Promise.resolve(
          json({
            body: {
              requests: isFirst
                ? segmentNumbers.map((number) => ({
                    method: 'PUT',
                    number,
                    url: `https://storage/${number}`,
                  }))
                : [],
              session: {
                ...largeSession,
                completedSegments: isFirst ? [] : completedAfterUpload,
                isStorageComplete: !isFirst,
              },
            },
          }),
        )
      }

      return Promise.resolve(json({ body: { file: { filename: 'video.mp4' } } }))
    }),
  )
}

const largeFile = new File([new Uint8Array(200)], 'video.mp4', {
  lastModified: 1,
  type: 'video/mp4',
})

const largeSession = {
  ...session,
  file: { filename: 'video.mp4', lastModified: 1, mimeType: 'video/mp4', size: 200 },
  transfer: {
    concurrency: 2,
    segments: [
      { end: 100, number: 1, start: 0 },
      { end: 200, number: 2, start: 100 },
    ],
  },
} as unknown as ClientUploadSession

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

        return Promise.resolve(json({ body: {} }))
      }),
    )
    stubSegmentUploads({ attempts: [{ status: 503 }, { status: 503 }] })

    const result = resumeUploadSession({ ...requestArgs, file, retries: 1, session }).catch(
      (err: unknown) => err,
    )

    await vi.advanceTimersByTimeAsync(0)

    expect(instructionRequests).toBe(1)

    await vi.advanceTimersByTimeAsync(1000)

    expect(instructionRequests).toBe(2)
    expect(await result).toMatchObject({ code: 'storageRejectedSegments' })
  })

  it('should report bytes sent within segments, summed across segments in flight', async () => {
    const progress: number[] = []

    stubSessionAPI({ completedAfterUpload: [1, 2], segmentNumbers: [1, 2] })
    stubSegmentUploads({
      attempts: [
        { progress: [30, 100], status: 200 },
        { progress: [50, 100], status: 200 },
      ],
    })

    const upload = resumeUploadSession({
      ...requestArgs,
      file: largeFile,
      onProgress: ({ loaded }) => progress.push(loaded),
      session: largeSession,
    })

    await vi.runAllTimersAsync()
    await upload

    // Partial bytes appear before any segment finishes, and the total ends at the file size.
    expect(progress[0]).toBeGreaterThan(0)
    expect(progress[0]).toBeLessThan(100)
    expect(progress.at(-1)).toBe(200)
    expect(progress).toEqual([...progress].sort((a, b) => a - b))
  })

  it('should not go backwards when a segment is sent again after a failure', async () => {
    const progress: number[] = []

    stubSessionAPI({ completedAfterUpload: [1], segmentNumbers: [1] })
    stubSegmentUploads({
      attempts: [
        { progress: [80], status: 500 },
        { progress: [10, 100], status: 200 },
      ],
    })

    const upload = resumeUploadSession({
      ...requestArgs,
      file: largeFile,
      onProgress: ({ loaded }) => progress.push(loaded),
      retries: 1,
      session: { ...largeSession, transfer: { ...largeSession.transfer, concurrency: 1 } },
    })

    await vi.runAllTimersAsync()
    await upload

    expect(progress).toEqual([...progress].sort((a, b) => a - b))
    expect(progress).toContain(80)
    expect(progress).not.toContain(10)
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
