import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'

import type { PayloadCloudEmailOptions } from './types.js'

type NodemailerAdapter = ReturnType<typeof nodemailerAdapter>

export const payloadCloudEmail = async (
  args: PayloadCloudEmailOptions,
): Promise<NodemailerAdapter | undefined> => {
  if (process.env.PAYLOAD_CLOUD !== 'true' || !args) {
    return undefined
  }

  if (!args.apiKey) {
    throw new Error('apiKey must be provided to use Payload Cloud Email')
  }
  if (!args.defaultDomain) {
    throw new Error('defaultDomain must be provided to use Payload Cloud Email')
  }

  // Check if already has email configuration

  if (args.config.email) {
    // eslint-disable-next-line no-console
    console.log(
      'Payload Cloud Email is enabled but email configuration is already provided in Payload config. If this is intentional, set `email: false` in the Payload Cloud plugin options.',
    )
    return args.config.email
  }

  const { apiKey, defaultDomain, skipVerify } = args

  const customDomainEnvs = Object.keys(process.env).filter(
    (e) => e.startsWith('PAYLOAD_CLOUD_EMAIL_DOMAIN_') && !e.endsWith('API_KEY'),
  )

  const customDomains = customDomainEnvs.map((e) => process.env[e]).filter(Boolean)

  if (customDomains.length) {
    // eslint-disable-next-line no-console
    console.log(
      `Configuring Payload Cloud Email for ${[defaultDomain, ...(customDomains || [])].join(', ')}`,
    )
  }

  const defaultFromName = args.defaultFromName || 'Payload CMS'
  const defaultFromAddress =
    args.defaultFromAddress || `cms@${customDomains.length ? customDomains[0] : defaultDomain}`

  const emailAdapter = await nodemailerAdapter({
    defaultFromAddress,
    defaultFromName,
    skipVerify,
    transport: nodemailer.createTransport({
      auth: {
        pass: apiKey,
        user: 'resend',
      },
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
    }),
  })

  return emailAdapter
}
