import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [],
  email: nodemailerAdapter(),
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const email = await payload.sendEmail({
      to: 'test@example.com',
      subject: 'This was sent on init',
    })

    payload.logger.info({ msg: 'Email sent', email })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
