import type { Transporter } from 'nodemailer'
import type { Payload } from 'payload'
import { describe, beforeEach, it, expect, Mock, vitest } from 'vitest'

import nodemailer from 'nodemailer'

import type { NodemailerAdapterArgs } from './index.js'

import { nodemailerAdapter } from './index.js'

const defaultArgs: NodemailerAdapterArgs = {
  defaultFromAddress: 'test@test.com',
  defaultFromName: 'Test',
}

const mockPayload = {} as Payload

describe('email-nodemailer', () => {
  it('should use the default from address when the message from address is blank', async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true })
    const sendMail = vitest.spyOn(transport, 'sendMail')
    const adapter = await nodemailerAdapter({
      ...defaultArgs,
      skipVerify: true,
      transport,
    })

    await adapter({ payload: mockPayload }).sendEmail({
      from: '',
      subject: 'Test email',
      to: 'recipient@test.com',
    })

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Test <test@test.com>',
      }),
    )
  })

  it('should use the message from address when one is provided', async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true })
    const sendMail = vitest.spyOn(transport, 'sendMail')
    const adapter = await nodemailerAdapter({
      ...defaultArgs,
      skipVerify: true,
      transport,
    })

    await adapter({ payload: mockPayload }).sendEmail({
      from: 'Custom Sender <custom@test.com>',
      subject: 'Test email',
      to: 'recipient@test.com',
    })

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Custom Sender <custom@test.com>',
      }),
    )
  })

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
})
