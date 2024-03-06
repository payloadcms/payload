import nodemailer from 'nodemailer'

import type { EmailOptions } from '../config/types.d.ts'
import type { MockEmailHandler } from './types.d.ts'

import { defaults as emailDefaults } from './defaults.js'

const mockEmailHandler = async (emailConfig: EmailOptions): Promise<MockEmailHandler> => {
  const testAccount = await nodemailer.createTestAccount()

  const smtpOptions = {
    ...emailConfig,
    auth: {
      pass: testAccount.pass,
      user: testAccount.user,
    },
    fromAddress: emailConfig?.fromAddress || emailDefaults.fromAddress,
    fromName: emailConfig?.fromName || emailDefaults.fromName,
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
  }

  return {
    account: testAccount,
    transport: nodemailer.createTransport(smtpOptions),
  }
}

export default mockEmailHandler
