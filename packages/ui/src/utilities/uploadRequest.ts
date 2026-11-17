import type { OnUploadProgress } from 'payload'

export type UploadRequestArgs = {
  body: Blob | FormData
  headers?: HeadersInit
  method: 'PATCH' | 'POST' | 'PUT'
  /** Report bytes sent by the browser. Called at most once per animation frame. */
  onProgress?: OnUploadProgress
  signal?: AbortSignal
  url: string
  /**
   * Send cookies to a cross-origin URL, like `fetch`'s `credentials: 'include'`. Use it for Payload
   * endpoints only, never for signed storage URLs. Same-origin requests always send cookies.
   */
  withCredentials?: boolean
}

const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])

/**
 * Sends an upload with `XMLHttpRequest`, because `fetch` cannot report upload progress, and
 * resolves to a standard `Response` so callers handle it like any other request. Non-2xx responses
 * resolve; only network errors and aborts reject.
 * @experimental
 */
export const uploadRequest = ({
  body,
  headers,
  method,
  onProgress,
  signal,
  url,
  withCredentials = false,
}: UploadRequestArgs): Promise<Response> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const xhr = new XMLHttpRequest()
    const progress = createProgressReporter({
      bodySize: body instanceof Blob ? body.size : undefined,
      onProgress,
    })

    const onAbortSignal = () => xhr.abort()
    const cleanUp = () => {
      progress.cancel()
      signal?.removeEventListener('abort', onAbortSignal)
    }

    xhr.open(method, url)
    xhr.responseType = 'blob'
    xhr.withCredentials = withCredentials

    new Headers(headers).forEach((value, key) => {
      xhr.setRequestHeader(key, value)
    })

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        progress.report({
          loaded: event.loaded,
          total: event.lengthComputable ? event.total : undefined,
        })
      }
    }

    xhr.onload = () => {
      const isSuccessful = xhr.status >= 200 && xhr.status < 300

      if (isSuccessful) {
        progress.complete()
      }

      cleanUp()
      resolve(
        new Response(NULL_BODY_STATUSES.has(xhr.status) ? null : (xhr.response as Blob | null), {
          headers: parseResponseHeaders({ rawHeaders: xhr.getAllResponseHeaders() }),
          status: xhr.status,
          statusText: xhr.statusText,
        }),
      )
    }

    xhr.onerror = () => {
      cleanUp()
      reject(new Error('The upload failed because of a network error.'))
    }

    xhr.ontimeout = xhr.onerror

    xhr.onabort = () => {
      cleanUp()
      reject(createAbortError())
    }

    signal?.addEventListener('abort', onAbortSignal, { once: true })
    xhr.send(body)
  })

/**
 * Keeps reported progress within the body size and never decreasing, and coalesces events to one
 * call per animation frame so a fast connection does not re-render on every chunk.
 */
const createProgressReporter = ({
  bodySize,
  onProgress,
}: {
  bodySize?: number
  onProgress?: OnUploadProgress
}) => {
  let loadedBytes = 0
  let totalBytes = bodySize ?? 0
  let pendingFrame: null | ReturnType<typeof scheduleFrame> = null

  const flush = () => {
    pendingFrame = null
    onProgress?.({ loadedBytes, totalBytes })
  }

  return {
    cancel: () => {
      if (pendingFrame !== null) {
        cancelFrame(pendingFrame)
        pendingFrame = null
      }
    },
    complete: () => {
      if (!onProgress) {
        return
      }

      if (pendingFrame !== null) {
        cancelFrame(pendingFrame)
      }

      loadedBytes = totalBytes
      flush()
    },
    report: ({ loaded, total }: { loaded: number; total?: number }) => {
      if (bodySize === undefined && total !== undefined && Number.isFinite(total) && total > 0) {
        totalBytes = Math.max(totalBytes, total)
      }

      const clampedLoaded = Math.min(Math.max(0, Number(loaded) || 0), totalBytes)

      loadedBytes = Math.max(loadedBytes, clampedLoaded)

      if (pendingFrame === null) {
        pendingFrame = scheduleFrame(flush)
      }
    },
  }
}

const scheduleFrame = (callback: () => void): number | ReturnType<typeof setTimeout> =>
  typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame(callback)
    : setTimeout(callback, 16)

const cancelFrame = (frame: ReturnType<typeof scheduleFrame>) => {
  if (typeof frame === 'number' && typeof globalThis.cancelAnimationFrame === 'function') {
    globalThis.cancelAnimationFrame(frame)
  } else {
    clearTimeout(frame)
  }
}

const parseResponseHeaders = ({ rawHeaders }: { rawHeaders: string }): Headers => {
  const headers = new Headers()

  for (const line of rawHeaders.trim().split(/[\r\n]+/)) {
    const separatorIndex = line.indexOf(':')

    if (separatorIndex > 0) {
      headers.append(line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim())
    }
  }

  return headers
}

const createAbortError = () => new DOMException('The upload was aborted.', 'AbortError')
