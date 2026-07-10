import type { Payload } from 'payload'
import { describe, afterEach, beforeEach, it, expect, vitest, Mock } from 'vitest'

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

  afterEach(() => {
    vitest.clearAllMocks()
  })

  it('should handle sending an email', async () => {
    global.fetch = vitest.spyOn(global, 'fetch').mockImplementation(
      vitest.fn(() =>
        Promise.resolve({
          json: () => {
            return { id: 'test-id' }
          },
        }),
      ) as Mock,
    ) as Mock

    const adapter = resendAdapter({
      apiKey,
      defaultFromAddress,
      defaultFromName,
    })

    await adapter({ payload: mockPayload }).sendEmail({
      from,
      subject,
      text,
      to,
    })

    // @ts-expect-error
    expect(global.fetch.mock.calls[0][0]).toStrictEqual('https://api.resend.com/emails')
    // @ts-expect-error
    const request = global.fetch.mock.calls[0][1]
    expect(request.headers.Authorization).toStrictEqual(`Bearer ${apiKey}`)
    expect(JSON.parse(request.body)).toMatchObject({
      from,
      subject,
      text,
      to,
    })
  })

  describe('attachments', () => {
    beforeEach(() => {
      global.fetch = vitest.spyOn(global, 'fetch').mockImplementation(
        vitest.fn(() =>
          Promise.resolve({
            json: () => ({ id: 'test-id' }),
          }),
        ) as Mock,
      ) as Mock
    })

    const adapter = () =>
      resendAdapter({ apiKey, defaultFromAddress, defaultFromName })({ payload: mockPayload })

    it('should pass path-only attachments through', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'file.pdf', path: '/tmp/file.pdf' }],
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.attachments).toStrictEqual([{ filename: 'file.pdf', path: '/tmp/file.pdf' }])
    })

    it('should preserve base64 string content without converting to Buffer', async () => {
      const base64 = 'SGVsbG8gV29ybGQ='

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'hello.txt', content: base64 }],
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.attachments).toStrictEqual([{ filename: 'hello.txt', content: base64 }])
    })

    it('should pass Buffer content through', async () => {
      const buf = Buffer.from('hello')

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'hello.txt', content: buf }],
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      // Buffer serializes to { type: 'Buffer', data: [...] } via JSON.stringify
      expect(body.attachments[0].filename).toBe('hello.txt')
      expect(body.attachments[0].content).toMatchObject({ type: 'Buffer' })
    })

    it('should throw when filename is missing', async () => {
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

      await adapter().sendEmail({
        from,
        to,
        subject,
        attachments: [{ filename: 'file.txt', content, path: '/tmp/file.txt' }],
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.attachments).toStrictEqual([{ filename: 'file.txt', content }])
    })
  })

  describe('headers', () => {
    beforeEach(() => {
      global.fetch = vitest.spyOn(global, 'fetch').mockImplementation(
        vitest.fn(() =>
          Promise.resolve({
            json: () => ({ id: 'test-id' }),
          }),
        ) as Mock,
      ) as Mock
    })

    const adapter = () =>
      resendAdapter({ apiKey, defaultFromAddress, defaultFromName })({ payload: mockPayload })

    it('should pass simple string headers through as-is', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'List-Unsubscribe': '<mailto:unsub@example.com>' },
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.headers).toStrictEqual({ 'List-Unsubscribe': '<mailto:unsub@example.com>' })
    })

    it('should join array string values with a comma', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'X-Custom': ['val1', 'val2'] },
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.headers).toStrictEqual({ 'X-Custom': 'val1, val2' })
    })

    it('should extract the value from prepared-object header values', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: { 'X-Prepared': { prepared: true, value: 'prepared-value' } },
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.headers).toStrictEqual({ 'X-Prepared': 'prepared-value' })
    })

    it('should convert array-of-objects header form to a plain object', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
        headers: [
          { key: 'X-First', value: 'first' },
          { key: 'X-Second', value: 'second' },
        ],
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body.headers).toStrictEqual({ 'X-First': 'first', 'X-Second': 'second' })
    })

    it('should omit the headers field when headers are undefined', async () => {
      await adapter().sendEmail({
        from,
        to,
        subject,
      })

      // @ts-expect-error
      const body = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(body).not.toHaveProperty('headers')
    })
  })

  it('should throw an error if the email fails to send', async () => {
    const errorResponse = {
      name: 'validation_error',
      message: 'error information',
      statusCode: 403,
    }
    global.fetch = vitest.spyOn(global, 'fetch').mockImplementation(
      vitest.fn(() =>
        Promise.resolve({
          json: () => errorResponse,
        }),
      ) as Mock,
    ) as Mock

    const adapter = resendAdapter({
      apiKey,
      defaultFromAddress,
      defaultFromName,
    })

    await expect(() =>
      adapter({ payload: mockPayload }).sendEmail({
        from,
        subject,
        text,
        to,
      }),
    ).rejects.toThrow(
      `Error sending email: ${errorResponse.statusCode} ${errorResponse.name} - ${errorResponse.message}`,
    )
  })
})
