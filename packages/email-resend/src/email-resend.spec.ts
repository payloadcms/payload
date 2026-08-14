import type { Payload } from 'payload'

import { afterEach, describe, expect, it, Mock, vitest } from 'vitest'

import { resendAdapter } from './index.js'

describe('email-resend', () => {
  const defaultFromAddress = 'dev@payloadcms.com'
  const defaultFromName = 'Payload CMS'
  const apiKey = 'test-api-key'
  const from = 'dev@payloadcms.com'
  const to = from
  const subject = 'This was sent on init'
  const text = 'This is my message body'

  const mockPayload = {} as unknown as Payload

  /**
   * Mocks `global.fetch` with a real `Response` so the adapter exercises the same
   * `Response` API (`ok`, `status`, `text`, `json`) it uses against the live Resend API.
   */
  const mockFetch = (body: string | unknown, init?: ResponseInit) => {
    const responseBody = typeof body === 'string' ? body : JSON.stringify(body)

    global.fetch = vitest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(responseBody, { status: 200, ...init })) as unknown as Mock

    return global.fetch as unknown as Mock
  }

  const getRequestBody = () => {
    // @ts-expect-error - fetch is mocked above
    return JSON.parse(global.fetch.mock.calls[0][1].body)
  }

  const adapter = () =>
    resendAdapter({ apiKey, defaultFromAddress, defaultFromName })({ payload: mockPayload })

  afterEach(() => {
    vitest.clearAllMocks()
  })

  it('should handle sending an email', async () => {
    const fetchMock = mockFetch({ id: 'test-id' })

    await adapter().sendEmail({
      from,
      subject,
      text,
      to,
    })

    expect(fetchMock.mock.calls[0][0]).toStrictEqual('https://api.resend.com/emails')
    const request = fetchMock.mock.calls[0][1]
    expect(request.headers.Authorization).toStrictEqual(`Bearer ${apiKey}`)
    expect(getRequestBody()).toMatchObject({
      from,
      subject,
      text,
      to,
    })
  })

  it('should return the parsed Resend response on success', async () => {
    mockFetch({ id: 'test-id' })

    const result = await adapter().sendEmail({ from, subject, text, to })

    expect(result).toStrictEqual({ id: 'test-id' })
  })

  describe('attachments', () => {
    it('should pass path-only attachments through', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'file.pdf', path: '/tmp/file.pdf' }],
      })

      expect(getRequestBody().attachments).toStrictEqual([
        { filename: 'file.pdf', path: '/tmp/file.pdf' },
      ])
    })

    it('should preserve base64 string content without converting to Buffer', async () => {
      const base64 = 'SGVsbG8gV29ybGQ='
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'hello.txt', content: base64 }],
      })

      expect(getRequestBody().attachments).toStrictEqual([
        { filename: 'hello.txt', content: base64 },
      ])
    })

    it('should pass Buffer content through', async () => {
      const buf = Buffer.from('hello')
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'hello.txt', content: buf }],
      })

      // Buffer serializes to { type: 'Buffer', data: [...] } via JSON.stringify
      const body = getRequestBody()
      expect(body.attachments[0].filename).toBe('hello.txt')
      expect(body.attachments[0].content).toMatchObject({ type: 'Buffer' })
    })

    it('should throw when filename is missing', async () => {
      mockFetch({ id: 'test-id' })

      await expect(() =>
        adapter().sendEmail({
          from,
          to,
          subject,
          attachments: [{ content: 'data' }],
        }),
      ).rejects.toThrow('Attachment is missing filename')
    })

    it('should throw when both content and path are missing', async () => {
      mockFetch({ id: 'test-id' })

      await expect(() =>
        adapter().sendEmail({
          from,
          to,
          subject,
          attachments: [{ filename: 'file.txt' }],
        }),
      ).rejects.toThrow('Attachment is missing both content and path')
    })

    it('should prefer content over path when both are provided', async () => {
      const content = 'SGVsbG8='
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'file.txt', content, path: '/tmp/file.txt' }],
      })

      expect(getRequestBody().attachments).toStrictEqual([{ filename: 'file.txt', content }])
    })
  })

  describe('address mapping', () => {
    it('should map a string reply-to to reply_to', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({ from, to, subject, replyTo: 'reply@example.com' })

      expect(getRequestBody().reply_to).toStrictEqual('reply@example.com')
    })

    it('should map cc and bcc recipients', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        bcc: ['bcc@example.com'],
        cc: 'cc@example.com',
      })

      const body = getRequestBody()
      expect(body.cc).toStrictEqual('cc@example.com')
      expect(body.bcc).toStrictEqual(['bcc@example.com'])
    })

    it('should map an array of address objects to their email strings', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        subject,
        to: [
          { name: 'One', address: 'one@example.com' },
          { name: 'Two', address: 'two@example.com' },
        ],
      })

      expect(getRequestBody().to).toStrictEqual(['one@example.com', 'two@example.com'])
    })

    it('should format a from address object as "Name <address>"', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from: { name: 'Sender', address: 'sender@example.com' },
        subject,
        to,
      })

      expect(getRequestBody().from).toStrictEqual('Sender <sender@example.com>')
    })

    it('should fall back to the default from address when none is provided', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({ subject, to } as Parameters<
        ReturnType<typeof adapter>['sendEmail']
      >[0])

      expect(getRequestBody().from).toStrictEqual(`${defaultFromName} <${defaultFromAddress}>`)
    })
  })

  describe('overrideRecipientAddress', () => {
    it('should send all mail to the override address', async () => {
      mockFetch({ id: 'test-id' })

      await resendAdapter({
        apiKey,
        defaultFromAddress,
        defaultFromName,
        overrideRecipientAddress: 'override@example.com',
      })({ payload: mockPayload }).sendEmail({ from, subject, text, to: 'real@example.com' })

      expect(getRequestBody().to).toStrictEqual('override@example.com')
    })
  })

  describe('headers', () => {
    it('should pass simple string headers through as-is', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'List-Unsubscribe': '<mailto:unsub@example.com>' },
      })

      expect(getRequestBody().headers).toStrictEqual({
        'List-Unsubscribe': '<mailto:unsub@example.com>',
      })
    })

    it('should join array string values with a comma', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'X-Custom': ['val1', 'val2'] },
      })

      expect(getRequestBody().headers).toStrictEqual({ 'X-Custom': 'val1, val2' })
    })

    it('should extract the value from prepared-object header values', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'X-Prepared': { prepared: true, value: 'prepared-value' } },
      })

      expect(getRequestBody().headers).toStrictEqual({ 'X-Prepared': 'prepared-value' })
    })

    it('should convert array-of-objects header form to a plain object', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: [
          { key: 'X-First', value: 'first' },
          { key: 'X-Second', value: 'second' },
        ],
      })

      expect(getRequestBody().headers).toStrictEqual({ 'X-First': 'first', 'X-Second': 'second' })
    })

    it('should omit the headers field when headers are undefined', async () => {
      mockFetch({ id: 'test-id' })

      await adapter().sendEmail({
        from,
        to,
        subject,
      })

      expect(getRequestBody()).not.toHaveProperty('headers')
    })
  })

  describe('error handling', () => {
    it('should throw a formatted error for a structured JSON error response', async () => {
      const errorResponse = {
        name: 'validation_error',
        message: 'error information',
        statusCode: 403,
      }
      mockFetch(errorResponse, { status: 403 })

      await expect(() => adapter().sendEmail({ from, subject, text, to })).rejects.toThrow(
        `Error sending email: ${errorResponse.statusCode} ${errorResponse.name} - ${errorResponse.message}`,
      )
    })

    it('should surface a non-JSON error body ("Origin is disallowed") instead of a JSON parse error', async () => {
      mockFetch('Origin is disallowed', { status: 403, statusText: 'Forbidden' })

      await expect(() => adapter().sendEmail({ from, subject, text, to })).rejects.toThrow(
        /Error sending email: 403.*Origin is disallowed/s,
      )
    })

    it('should throw with the status code when the error body is empty', async () => {
      mockFetch('', { status: 500, statusText: 'Internal Server Error' })

      await expect(() => adapter().sendEmail({ from, subject, text, to })).rejects.toThrow(
        /Error sending email: 500/,
      )
    })

    it('should throw when a 2xx response body is not valid JSON', async () => {
      mockFetch('<html>not json</html>', { status: 200 })

      await expect(() => adapter().sendEmail({ from, subject, text, to })).rejects.toThrow(
        /Error sending email/,
      )
    })

    it('should throw when a 2xx response is missing an id', async () => {
      mockFetch({ unexpected: 'shape' }, { status: 200 })

      await expect(() => adapter().sendEmail({ from, subject, text, to })).rejects.toThrow(
        /Error sending email/,
      )
    })
  })
})
