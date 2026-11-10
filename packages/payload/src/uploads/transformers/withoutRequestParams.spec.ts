import { describe, expect, it } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

import { withoutRequestParams } from './withoutRequestParams.js'

const requestURL = 'https://example.test/api/media/file/photo.png?version=1&w=200&q=70'

/** Builds a request the way the REST handler does: a native `Request` with Payload's fields. */
const createRESTRequest = (): PayloadRequest => {
  const url = new URL(requestURL)

  return Object.assign(new Request(url, { headers: { 'x-test': 'kept' } }), {
    context: { shared: true },
    href: url.href,
    query: { q: '70', version: '1', w: '200' },
    search: url.search,
    searchParams: url.searchParams,
    user: null,
  }) as unknown as PayloadRequest
}

describe('withoutRequestParams', () => {
  it('should remove the query string from every form of the URL', () => {
    const view = withoutRequestParams({ req: createRESTRequest() })

    expect(view.url).toBe('https://example.test/api/media/file/photo.png')
    expect(view.href).toBe('https://example.test/api/media/file/photo.png')
    expect(view.search).toBe('')
    expect(view.searchParams.size).toBe(0)
    expect(view.query).toEqual({})
  })

  it('should keep the headers and the Payload fields of the caller', () => {
    const req = createRESTRequest()
    const view = withoutRequestParams({ req })

    expect(view.headers.get('x-test')).toBe('kept')
    expect(view.context).toBe(req.context)
    expect(view.user).toBeNull()
  })

  it('should not write to the caller when the view is changed', () => {
    const req = createRESTRequest()
    const view = withoutRequestParams({ req })

    view.query = view.query || {}
    view.query.depth = 1
    view.query = { replaced: true }
    view.fileTransform = true

    expect(req.query).toEqual({ q: '70', version: '1', w: '200' })
    expect(req.searchParams.get('w')).toBe('200')
    expect(req.fileTransform).toBeUndefined()
  })

  it('should support native Request operations without the query string', () => {
    const view = withoutRequestParams({ req: createRESTRequest() }) as unknown as Request

    expect(view.clone().url).toBe('https://example.test/api/media/file/photo.png')
    expect(new Request(view).url).toBe('https://example.test/api/media/file/photo.png')
  })

  it('should remove the query string from a Local API request', () => {
    const req = {
      query: { w: '200' },
      searchParams: new URLSearchParams('w=200'),
      url: 'http://localhost/api?w=200',
    } as unknown as PayloadRequest
    const view = withoutRequestParams({ req })

    expect(view.url).toBe('http://localhost/api')
    expect(view.searchParams.size).toBe(0)
    expect(view.query).toEqual({})
    expect(req.query).toEqual({ w: '200' })
  })
})
