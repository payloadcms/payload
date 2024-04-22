import type { EmailAdapter } from './types.js'

import { emailDefaults } from './defaults.js'
import { getStringifiedToAddress } from './getStringifiedToAddress.js'

export const stdoutAdapter: EmailAdapter<void> = ({ payload }) => ({
  defaultFromAddress: emailDefaults.defaultFromAddress,
  defaultFromName: emailDefaults.defaultFromName,
  sendEmail: async (message) => {
    const stringifiedTo = getStringifiedToAddress(message)
    const res = `EMAIL NON-DELIVERY. To: '${stringifiedTo}', Subject: '${message.subject}'`
    payload.logger.info({ msg: res })
    return Promise.resolve()
  },
})
