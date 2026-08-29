import { afterEach, describe, expect, it, vi } from 'vitest'

import { D1HttpBinding } from './d1-http-binding.js'

const mockConfig = {
  accountId: 'test-account',
  apiToken: 'test-token',
  databaseId: 'test-db',
}

function mockFetchJson(body: object) {
  const text = JSON.stringify(body)

  return vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(text),
  })
}

describe('D1HttpBinding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should prepare statements', () => {
    const binding = new D1HttpBinding(mockConfig)
    const stmt = binding.prepare('SELECT * FROM users WHERE id = ?')

    expect(stmt).toBeDefined()
    expect(stmt.sql).toBe('SELECT * FROM users WHERE id = ?')
  })

  it('should bind parameters immutably', () => {
    const binding = new D1HttpBinding(mockConfig)
    const stmt1 = binding.prepare('SELECT * FROM users WHERE id = ?')
    const stmt2 = stmt1.bind(123)

    expect(stmt1).not.toBe(stmt2)
    expect(stmt1.params).toEqual([])
    expect(stmt2.params).toEqual([123])
  })

  it('should execute query via HTTP', async () => {
    const fetchMock = mockFetchJson({
      result: [
        {
          meta: { duration: 0.5 },
          results: [{ id: 1, name: 'Test' }],
          success: true,
        },
      ],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)
    const result = await binding.prepare('SELECT * FROM users').all()

    expect(result.results).toEqual([{ id: 1, name: 'Test' }])
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/test-account/d1/database/test-db/query',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
        method: 'POST',
      }),
    )
  })

  it('should throw when API returns top-level success false', async () => {
    const fetchMock = mockFetchJson({
      errors: [{ code: 7500, message: 'fail' }],
      success: false,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)

    await expect(binding.prepare('SELECT 1').all()).rejects.toThrow(/D1 query failed/)
  })

  it('should throw when a single query row has success false', async () => {
    const fetchMock = mockFetchJson({
      result: [{ error: 'syntax error', success: false }],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)

    await expect(binding.prepare('SELECT 1').all()).rejects.toThrow(/D1 HTTP query failed/)
  })

  it('should run batch with one result per statement', async () => {
    const fetchMock = mockFetchJson({
      result: [
        { meta: { changes: 1, duration: 0.1 }, results: [], success: true },
        { meta: { changes: 0, duration: 0.1 }, results: [{ id: 1 }], success: true },
      ],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)
    const a = binding.prepare('INSERT INTO t (x) VALUES (?)').bind('a')
    const b = binding.prepare('SELECT * FROM t').bind()

    const results = await binding.batch([a, b])

    expect(results).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"batch"'),
      }),
    )
  })

  it('should throw when batch receives non-D1HttpPreparedStatement', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ result: [], success: true }))

    const binding = new D1HttpBinding(mockConfig)

    await expect(binding.batch([{} as never])).rejects.toThrow(
      /expected statements from this binding/,
    )
  })

  it('should throw when batch result count mismatches statement count', async () => {
    const fetchMock = mockFetchJson({
      result: [{ meta: {}, results: [], success: true }],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)
    const a = binding.prepare('SELECT 1')
    const b = binding.prepare('SELECT 2')

    await expect(binding.batch([a, b])).rejects.toThrow(/expected 2 result/)
  })

  it('should throw when a batch row has success false', async () => {
    const fetchMock = mockFetchJson({
      result: [
        { meta: {}, results: [], success: true },
        { error: 'constraint', success: false },
      ],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)
    const a = binding.prepare('SELECT 1')
    const b = binding.prepare('SELECT 2')

    await expect(binding.batch([a, b])).rejects.toThrow(/batch statement 1 failed/)
  })

  it('should return exec meta from first result', async () => {
    const fetchMock = mockFetchJson({
      result: [{ meta: { changes: 3, duration: 1.2 }, results: [], success: true }],
      success: true,
    })

    vi.stubGlobal('fetch', fetchMock)

    const binding = new D1HttpBinding(mockConfig)
    const out = await binding.exec('DELETE FROM t')

    expect(out).toEqual({ count: 3, duration: 1.2 })
  })
})
