import { resendAdapter } from '@payloadcms/email-resend'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [],

  // NOTE: The from address and api key should be properly set
  // See email-resend README for more information
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const email = await payload.sendEmail({
      to: 'dev@payloadcms.com',
      subject: 'This was sent on init',
      text: 'This is my message body',
    })

    payload.logger.info({ msg: 'Email sent', email })
  },
})
