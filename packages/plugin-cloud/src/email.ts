import type { EmailTransport } from 'payload/config'

import nodemailer from 'nodemailer'

import type { PayloadCloudEmailOptions } from './types'

export const payloadCloudEmail = (args: PayloadCloudEmailOptions): EmailTransport | undefined => {
  if (process.env.PAYLOAD_CLOUD !== 'true' || !args) {
    return undefined
  }

  if (!args.apiKey) throw new Error('apiKey must be provided to use Payload Cloud Email ')
  if (!args.defaultDomain)
    throw new Error('defaultDomain must be provided to use Payload Cloud Email')

  const { apiKey, config, defaultDomain } = args

  const customDomainEnvs = Object.keys(process.env).filter(
    (e) => e.startsWith('PAYLOAD_CLOUD_EMAIL_DOMAIN_') && !e.endsWith('API_KEY'),
  )

  const customDomains = customDomainEnvs.map((e) => process.env[e]).filter(Boolean)

  if (customDomains.length) {
    console.log(
      `Configuring Payload Cloud Email for ${[defaultDomain, ...(customDomains || [])].join(', ')}`,
    )
  }

  const fromName = config.email?.fromName || 'Payload CMS'
  const fromAddress =
    config.email?.fromAddress || `cms@${customDomains.length ? customDomains[0] : defaultDomain}`

  const existingTransport = config.email && 'transport' in config.email && config.email?.transport

  if (existingTransport) {
    return {
      fromAddress,
      fromName,
      transport: existingTransport,
    }
  }

  return {
    fromAddress,
    fromName,
    transport: nodemailer.createTransport({
      auth: {
        pass: apiKey,
        user: 'resend',
      },
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
    }),
  }
}
