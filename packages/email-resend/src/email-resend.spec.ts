import type { Payload } from 'payload'
import { describe, afterEach, it, expect, vitest, Mock } from 'vitest'

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
