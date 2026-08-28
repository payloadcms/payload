import type { NodemailerAdapterArgs } from '@payloadcms/email-nodemailer'

import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { fileURLToPath } from 'url'
import { expect, type Mock, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import testConfig from './config.js'

let mockedSendEmail: Mock

const overrideRecipientAddress = 'overriden@example.com'

type EmailReturnType = {
  subject: string
  text: string
  to: string
}

test.suite({ config: testConfig })('@payloadcms/email-nodemailer', () => {
  test.beforeEach(async () => {
    mockedSendEmail = vi.fn()
  })

  test.describe('without basic config', () => {
    test.beforeEach(async ({ payload }) => {
      // Partially mocked transport
      const mockedTransport = {
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

    test('sends email with overrideRecipientAddress', async ({ payload }) => {
      const email = (await payload.email.sendEmail({
        to: 'dev@example.com',
        text: 'Hello, world!',
        subject: 'Test email',
      })) as EmailReturnType

      expect(email.to).toEqual('dev@example.com')
    })
  })

  test.describe('with overrideRecipientAddress', () => {
    test.beforeEach(async ({ payload }) => {
      // Partially mocked transport
      const mockedTransport = {
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

    test('sends email with overrideRecipientAddress', async ({ payload }) => {
      const email = (await payload.email.sendEmail({
        to: 'dev@example.com',
        text: 'Hello, world!',
        subject: 'Test email',
      })) as EmailReturnType

      expect(email.to).toEqual(overrideRecipientAddress)
    })
  })
})
