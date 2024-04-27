import type { EmailAdapter } from './types.js'

import { emailDefaults } from './defaults.js'
import { getStringifiedToAddress } from './getStringifiedToAddress.js'

export const consoleEmailAdapter: EmailAdapter<void> = ({ payload }) => ({
  name: 'console',
  defaultFromAddress: emailDefaults.defaultFromAddress,
  defaultFromName: emailDefaults.defaultFromName,
  sendEmail: async (message) => {
    const stringifiedTo = getStringifiedToAddress(message)
    const res = `Email attempted without being configured. To: '${stringifiedTo}', Subject: '${message.subject}'`
    payload.logger.info({ msg: res })
    return Promise.resolve()
  },
})
