import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import type { EmailTransport } from 'payload/config'
import type { PayloadCloudEmailOptions } from './types'

type TransportArgs = Parameters<typeof nodemailer.createTransport>[0]

export const payloadCloudEmail = (args: PayloadCloudEmailOptions): EmailTransport | undefined => {
  if (process.env.PAYLOAD_CLOUD !== 'true' || !args) {
    return undefined
  }

  if (!args.apiKey) throw new Error('apiKey must be provided to use Payload Cloud Email ')
  if (!args.defaultDomain)
    throw new Error('defaultDomain must be provided to use Payload Cloud Email')

  const { apiKey, defaultDomain, config } = args

  const customDomainEnvs = Object.keys(process.env).filter(
    e => e.startsWith('PAYLOAD_CLOUD_EMAIL_DOMAIN_') && !e.endsWith('API_KEY'),
  )

  // Match up the envs with api keys: { key: PAYLOAD_CLOUD_EMAIL_DOMAIN_${i}, value: domain }
  const customDomainsResendMap =
    customDomainEnvs?.reduce((acc, envKey) => {
      const apiKey = process.env[`${envKey}_API_KEY`]
      if (!apiKey) {
        throw new Error(
          `PAYLOAD_CLOUD_EMAIL_DOMAIN_${envKey} is missing a corresponding PAYLOAD_CLOUD_EMAIL_DOMAIN_${envKey}_API_KEY`,
        )
      }

      acc[process.env[envKey] as string] = new Resend(apiKey)
      return acc
    }, {} as Record<string, Resend>) || {}

  const customDomains = Object.keys(customDomainsResendMap)

  if (customDomains.length) {
    console.log(
      `Configuring Payload Cloud Email for ${[defaultDomain, ...(customDomains || [])].join(', ')}`,
    )
  }

  const resendDomainMap: Record<string, Resend> = {
    [defaultDomain]: new Resend(apiKey),
    ...customDomainsResendMap,
  }

  const fromName = config.email?.fromName || 'Payload CMS'
  const fromAddress =
    config.email?.fromAddress || `cms${customDomains.length ? customDomains[0] : defaultDomain}`

  const existingTransport = config.email && 'transport' in config.email && config.email?.transport

  if (existingTransport) {
    return {
      fromName: fromName,
      fromAddress: fromAddress,
      transport: existingTransport,
    }
  }

  const transportConfig: TransportArgs = {
    name: 'payload-cloud',
    version: '0.0.1',
    send: async (mail, callback) => {
      const { from, to, subject, html, text } = mail.data

      if (!to) return callback(new Error('No "to" address provided'), null)

      if (!from) return callback(new Error('No "from" address provided'), null)

      const cleanTo: string[] = []
      const toArr = Array.isArray(to) ? to : [to]

      toArr.forEach(toItem => {
        if (typeof toItem === 'string') {
          cleanTo.push(toItem)
        } else {
          cleanTo.push(toItem.address)
        }
      })

      let fromToUse: string

      if (typeof from === 'string') {
        fromToUse = from
      } else if (typeof from === 'object' && 'name' in from && 'address' in from) {
        fromToUse = `${from.name} <${from.address}>`
      } else {
        fromToUse = `${fromName} <${fromAddress}>`
      }

      // Parse domain. Can be in 2 possible formats:  "name@domain.com" or "Friendly Name <name@domain.com>"
      const domainMatch = fromToUse.match(/(?<=@)[^(\s|>)]+/g)

      if (!domainMatch) {
        return callback(new Error(`Could not parse domain from "from" address: ${fromToUse}`), null)
      }

      const fromDomain = domainMatch[0]
      const resend = resendDomainMap[fromDomain]

      if (!resend) {
        callback(
          new Error(
            `No Resend instance found for domain: ${fromDomain}. Available domains: ${Object.keys(
              resendDomainMap,
            ).join(', ')}`,
          ),
          null,
        )
      }

      try {
        const sendResponse = await resend.sendEmail({
          from: fromToUse,
          to: cleanTo,
          subject: subject || '<No subject>',
          html: (html || text) as string,
        })

        if ('error' in sendResponse) {
          return callback(new Error('Error sending email', { cause: sendResponse.error }), null)
        }
        return callback(null, sendResponse)
      } catch (err: unknown) {
        if (isResendError(err)) {
          return callback(
            new Error(`Error sending email: ${err.statusCode} ${err.name}: ${err.message}`),
            null,
          )
        } else if (err instanceof Error) {
          return callback(
            new Error(`Unexpected error sending email: ${err.message}: ${err.stack}`),
            null,
          )
        } else {
          return callback(new Error(`Unexpected error sending email: ${err}`), null)
        }
      }
    },
  }

  return {
    fromName: fromName,
    fromAddress: fromAddress,
    transport: nodemailer.createTransport(transportConfig),
  }
}

type ResendError = {
  name: string
  message: string
  statusCode: number
}

function isResendError(err: unknown): err is ResendError {
  return Boolean(
    err && typeof err === 'object' && 'message' in err && 'statusCode' in err && 'name' in err,
  )
}
