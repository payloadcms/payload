import type { Transporter } from 'nodemailer'

import { jest } from '@jest/globals'
import nodemailer from 'nodemailer'

import type { NodemailerAdapterArgs } from './index.js'

import { nodemailerAdapter } from './index.js'

const defaultArgs: NodemailerAdapterArgs = {
  defaultFromAddress: 'test@test.com',
  defaultFromName: 'Test',
}

describe('email-nodemailer', () => {
  describe('transport verification', () => {
    let mockedVerify: jest.Mock<Transporter['verify']>
    let mockTransport: Transporter

    beforeEach(() => {
      mockedVerify = jest.fn<Transporter['verify']>()
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
