import { resendAdapter } from './index.js'
import { Payload } from 'payload'
import { jest } from '@jest/globals'

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
    jest.clearAllMocks()
  })

  it('should handle sending an email', async () => {
    global.fetch = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () => {
            return { id: 'test-id' }
          },
        }),
      ) as jest.Mock,
    ) as jest.Mock

    const adapter = resendAdapter({
      defaultFromAddress,
      defaultFromName,
      apiKey,
    })

    await adapter({ payload: mockPayload }).sendEmail({
      from,
      to,
      subject,
      text,
    })

    // @ts-expect-error
    expect(global.fetch.mock.calls[0][0]).toStrictEqual('https://api.resend.com/emails')
    // @ts-expect-error
    const request = global.fetch.mock.calls[0][1]
    expect(request.headers.Authorization).toStrictEqual(`Bearer ${apiKey}`)
    expect(JSON.parse(request.body)).toMatchObject({
      from,
      to,
      subject,
      text,
    })
  })

  it('should throw an error if the email fails to send', async () => {
    const errorResponse = {
      message: 'error information',
      name: 'validation_error',
      statusCode: 403,
    }
    global.fetch = jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () => errorResponse,
        }),
      ) as jest.Mock,
    ) as jest.Mock

    const adapter = resendAdapter({
      defaultFromAddress,
      defaultFromName,
      apiKey,
    })

    await expect(() =>
      adapter({ payload: mockPayload }).sendEmail({
        from,
        to,
        subject,
        text,
      }),
    ).rejects.toThrow(
      `Error sending email: ${errorResponse.statusCode} ${errorResponse.name} - ${errorResponse.message}`,
    )
  })
})
