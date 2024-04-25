import { resendAdapter } from '@payloadcms/email-resend-rest'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [],
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: String(process.env.RESEND_API_KEY),
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
      to: 'elliot@payloadcms.com',
      subject: 'This was sent on init',
      text: 'This is my message body',
    })

    payload.logger.info({ msg: 'Email sent', email })
  },
})
