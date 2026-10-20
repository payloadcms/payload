import type { Transporter } from 'nodemailer'
import { describe, beforeEach, it, expect, Mock, vitest } from 'vitest'

import nodemailer from 'nodemailer'

import type { NodemailerAdapterArgs } from './index.js'

import { nodemailerAdapter } from './index.js'

const defaultArgs: NodemailerAdapterArgs = {
  defaultFromAddress: 'test@test.com',
  defaultFromName: 'Test',
}

describe('email-nodemailer', () => {
  describe('transport verification', () => {
    let mockedVerify: Mock<Transporter['verify']>
    let mockTransport: Transporter

    beforeEach(() => {
      mockedVerify = vitest.fn()
      mockTransport = nodemailer.createTransport({
        name: 'existing-transport',
        // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-misused-promises
        send: async (mail) => {
          // eslint-disable-next-line no-console
          console.log('mock send', mail)
        },
        verify: mockedVerify,
        version: '0.0.1',
      })
    })

    it('should be invoked when skipVerify = false', async () => {
      await nodemailerAdapter({
        ...defaultArgs,
        skipVerify: false,
        transport: mockTransport,
      })

      expect(mockedVerify.mock.calls).toHaveLength(1)
    })

    it('should be invoked when skipVerify is undefined', async () => {
      await nodemailerAdapter({
        ...defaultArgs,
        skipVerify: false,
        transport: mockTransport,
      })

      expect(mockedVerify.mock.calls).toHaveLength(1)
    })

    it('should not be invoked when skipVerify = true', async () => {
      await nodemailerAdapter({
        ...defaultArgs,
        skipVerify: true,
        transport: mockTransport,
      })

      expect(mockedVerify.mock.calls).toHaveLength(0)
    })
  })

  describe('sendEmail', () => {
    it('should send the message ID string when inReplyTo is an address object', async () => {
      const transport = nodemailer.createTransport({ jsonTransport: true })
      const sendMail = vitest.spyOn(transport, 'sendMail')
      const adapter = await nodemailerAdapter({ ...defaultArgs, skipVerify: true, transport })

      await adapter({ payload: {} as never }).sendEmail({
        inReplyTo: { address: '<original@example.com>', name: 'Original' },
        to: 'to@example.com',
      })

      expect(sendMail.mock.calls[0]?.[0]).toMatchObject({ inReplyTo: '<original@example.com>' })
    })

    it('should keep the transport default inReplyTo when the message omits it', async () => {
      const transport = nodemailer.createTransport(
        { jsonTransport: true },
        { inReplyTo: '<default@example.com>' },
      )
      const adapter = await nodemailerAdapter({ ...defaultArgs, skipVerify: true, transport })

      const info = (await adapter({ payload: {} as never }).sendEmail({
        to: 'to@example.com',
      })) as { message: string }

      expect(JSON.parse(info.message)).toMatchObject({ inReplyTo: '<default@example.com>' })
    })
  })
})
