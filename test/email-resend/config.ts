import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { resendAdapter } from '@payloadcms/email-resend'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [],

  // NOTE: The from address and api key should be properly set
  // See email-resend README for more information
  email: resendAdapter({
    apiKey: process.env.RESEND_API_KEY || '',
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
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
      subject: 'This was sent on init',
      text: 'This is my message body',
      to: 'dev@payloadcms.com',
    })

    payload.logger.info({ email, msg: 'Email sent' })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
