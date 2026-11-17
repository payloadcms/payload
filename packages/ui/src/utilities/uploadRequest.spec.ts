import type { UploadTransferProgress } from 'payload'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadRequest } from './uploadRequest.js'

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = []

  method?: string
  onabort?: () => void
  onerror?: () => void
  onload?: () => void
  ontimeout?: () => void
  requestHeaders: Record<string, string> = {}
  response: Blob | null = null
  responseHeaders = ''
  responseType = ''
  sentBody?: unknown
  status = 0
  statusText = ''
  upload: {
    onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void
  } = {}
  url?: string
  withCredentials = false

  constructor() {
    FakeXMLHttpRequest.instances.push(this)
  }

  abort() {
    this.onabort?.()
  }

  getAllResponseHeaders() {
    return this.responseHeaders
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  respond({
    body = '',
    headers = '',
    status,
  }: {
    body?: string
    headers?: string
    status: number
  }) {
    this.status = status
    this.statusText = status === 200 ? 'OK' : 'Error'
    this.response = new Blob([body])
    this.responseHeaders = headers
    this.onload?.()
  }

  send(body: unknown) {
    this.sentBody = body
  }

  setRequestHeader(key: string, value: string) {
    this.requestHeaders[key] = value
  }
}

const getXHR = () => FakeXMLHttpRequest.instances.at(-1)!

describe('uploadRequest', () => {
  beforeEach(() => {
    FakeXMLHttpRequest.instances = []
    vi.useFakeTimers()
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should resolve a Response with status, headers and body', async () => {
    const request = uploadRequest({
      body: new Blob(['file']),
      headers: { 'Content-Type': 'video/mp4' },
      method: 'PUT',
      url: 'https://bucket.example.com/upload',
    })

    getXHR().respond({
      body: '{"ok":true}',
      headers: 'content-type: application/json\r\netag: "abc"',
      status: 200,
    })

    const response = await request

    expect(getXHR().method).toBe('PUT')
    expect(getXHR().requestHeaders['content-type']).toBe('video/mp4')
    expect(response.status).toBe(200)
    expect(response.headers.get('etag')).toBe('"abc"')
    expect(await response.json()).toEqual({ ok: true })
  })

  it('should resolve non-2xx responses so callers can read the error', async () => {
    const request = uploadRequest({ body: new Blob(['file']), method: 'POST', url: '/api/media' })

    getXHR().respond({ body: '{"errors":[{"message":"Invalid"}]}', status: 400 })

    const response = await request

    expect(response.ok).toBe(false)
    expect(await response.json()).toEqual({ errors: [{ message: 'Invalid' }] })
  })

  it('should reject on network errors', async () => {
    const request = uploadRequest({ body: new Blob(['file']), method: 'PUT', url: '/upload' })

    getXHR().onerror?.()

    await expect(request).rejects.toThrow('network error')
  })

  it('should reject with an AbortError when the signal aborts', async () => {
    const controller = new AbortController()
    const request = uploadRequest({
      body: new Blob(['file']),
      method: 'PUT',
      signal: controller.signal,
      url: '/upload',
    })

    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('should send cookies cross-origin only when asked', () => {
    void uploadRequest({
      body: new Blob(['file']),
      method: 'PUT',
      url: 'https://bucket.example.com',
    })
    expect(getXHR().withCredentials).toBe(false)

    void uploadRequest({
      body: new FormData(),
      method: 'POST',
      url: 'https://api.example.com/api/media',
      withCredentials: true,
    })
    expect(getXHR().withCredentials).toBe(true)
  })

  it('should report clamped, never decreasing progress once per frame and 100% on success', async () => {
    const events: UploadTransferProgress[] = []
    const request = uploadRequest({
      body: new Blob(['0123456789']),
      method: 'PUT',
      onProgress: (progress) => events.push(progress),
      url: '/upload',
    })
    const { upload } = getXHR()

    upload.onprogress?.({ lengthComputable: true, loaded: 4, total: 10 })
    upload.onprogress?.({ lengthComputable: true, loaded: 6, total: 10 })
    vi.runOnlyPendingTimers()
    upload.onprogress?.({ lengthComputable: true, loaded: 3, total: 10 })
    vi.runOnlyPendingTimers()
    upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 10 })
    vi.runOnlyPendingTimers()
    getXHR().respond({ status: 200 })
    await request

    expect(events).toEqual([
      { loadedBytes: 6, totalBytes: 10 },
      { loadedBytes: 6, totalBytes: 10 },
      { loadedBytes: 10, totalBytes: 10 },
      { loadedBytes: 10, totalBytes: 10 },
    ])
  })

  it('should not report 100% when the server rejects the upload', async () => {
    const events: UploadTransferProgress[] = []
    const request = uploadRequest({
      body: new Blob(['0123456789']),
      method: 'PUT',
      onProgress: (progress) => events.push(progress),
      url: '/upload',
    })

    getXHR().upload.onprogress?.({ lengthComputable: true, loaded: 2, total: 10 })
    getXHR().respond({ status: 413 })
    await request
    vi.runOnlyPendingTimers()

    expect(events).toEqual([])
  })

  it('should use the progress event total for FormData bodies', async () => {
    const events: UploadTransferProgress[] = []
    const request = uploadRequest({
      body: new FormData(),
      method: 'POST',
      onProgress: (progress) => events.push(progress),
      url: '/api/media',
    })

    getXHR().upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 120 })
    vi.runOnlyPendingTimers()
    getXHR().respond({ status: 200 })
    await request

    expect(events).toEqual([
      { loadedBytes: 50, totalBytes: 120 },
      { loadedBytes: 120, totalBytes: 120 },
    ])
  })

  it('should handle empty bodies', async () => {
    const events: UploadTransferProgress[] = []
    const request = uploadRequest({
      body: new Blob([]),
      method: 'PUT',
      onProgress: (progress) => events.push(progress),
      url: '/upload',
    })

    getXHR().upload.onprogress?.({ lengthComputable: false, loaded: 0, total: 0 })
    getXHR().respond({ status: 204 })
    const response = await request

    expect(response.status).toBe(204)
    expect(events).toEqual([{ loadedBytes: 0, totalBytes: 0 }])
  })
})
