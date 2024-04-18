import type { SendMailOptions } from 'nodemailer'

import type { Payload } from '../index.js'
import type { EmailAdapter } from './types.js'

import { emailDefaults } from './defaults.js'
import { getStringifiedToAddress } from './getStringifiedToAddress.js'

export type StdoutAdapter = EmailAdapter<SendMailOptions, void>

export const createStdoutAdapter = (payload: Payload) => {
  const stdoutAdapter: StdoutAdapter = {
    defaultFromAddress: emailDefaults.defaultFromAddress,
    defaultFromName: emailDefaults.defaultFromName,
    sendEmail: async (message) => {
      const stringifiedTo = getStringifiedToAddress(message)
      const res = `EMAIL NON-DELIVERY. To: '${stringifiedTo}', Subject: '${message.subject}'`
      payload.logger.info({ msg: res })
      return Promise.resolve()
    },
  }
  return stdoutAdapter
}
