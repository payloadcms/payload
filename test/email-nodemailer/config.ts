import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

export default buildConfigWithDefaults({
  suite: 'email-nodemailer',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [],
    // Integration tests run offline; local development keeps the Ethereal inbox.
    email: nodemailerAdapter(
      process.env.VITEST === 'true'
        ? {
            defaultFromAddress: 'test@example.com',
            defaultFromName: 'Test',
            skipVerify: true,
            transport: nodemailer.createTransport({
              jsonTransport: true,
            }),
          }
        : undefined,
    ),
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  },
})
