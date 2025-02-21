import type { NodemailerAdapterArgs } from '@payloadcms/email-nodemailer'
import type { Payload } from 'payload'

import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let mockedSendEmail: jest.Mock

const overrideRecipientAddress = 'overriden@example.com'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type EmailReturnType = {
  subject: string
  text: string
  to: string
}

describe('@payloadcms/email-nodemailer', () => {
  beforeAll(async () => {
    process.env.SKIP_ON_INIT = 'true'
    ;({ payload } = await initPayloadInt(dirname))

    mockedSendEmail = jest.fn()
  })

  afterAll(async () => {
    if (typeof payload?.db?.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('without basic config', () => {
    beforeEach(async () => {
      // Partially mocked transport
      const mockedTransport = {
        // eslint-disable-next-line @typescript-eslint/require-await
        sendMail: async (message) => {
          mockedSendEmail()
          return message
        },
      } as NodemailerAdapterArgs['transport']

      const adapter = await nodemailerAdapter({
        defaultFromAddress: 'test@example.com',
        defaultFromName: 'Test',
        skipVerify: true,
        transport: mockedTransport,
      })

      const mockedAdapter = adapter({ payload })

      payload.email = mockedAdapter
    })

    it('sends email with overrideRecipientAddress', async () => {
      const email = (await payload.email.sendEmail({
        to: 'dev@example.com',
        text: 'Hello, world!',
        subject: 'Test email',
      })) as EmailReturnType

      expect(email.to).toEqual('dev@example.com')
    })
  })

  describe('with overrideRecipientAddress', () => {
    beforeEach(async () => {
      // Partially mocked transport
      const mockedTransport = {
        // eslint-disable-next-line @typescript-eslint/require-await
        sendMail: async (message) => {
          mockedSendEmail()
          return message
        },
      } as NodemailerAdapterArgs['transport']

      const adapter = await nodemailerAdapter({
        overrideRecipientAddress,
        defaultFromAddress: 'test@example.com',
        defaultFromName: 'Test',
        skipVerify: true,
        transport: mockedTransport,
      })

      const mockedAdapter = adapter({ payload })

      payload.email = mockedAdapter
    })

    it('sends email with overrideRecipientAddress', async () => {
      const email = (await payload.email.sendEmail({
        to: 'dev@example.com',
        text: 'Hello, world!',
        subject: 'Test email',
      })) as EmailReturnType

      expect(email.to).toEqual(overrideRecipientAddress)
    })
  })
})
