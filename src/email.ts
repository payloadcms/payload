import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import payload from 'payload'
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

  const resend = new Resend(apiKey)

  const fromName = config.email?.fromName || 'Payload CMS'
  const fromAddress = config.email?.fromAddress || `cms@${defaultDomain}`
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
    send: async mail => {
      const { from, to, subject, html, text } = mail.data

      const cleanTo: string[] = []

      if (typeof to === 'string') {
        cleanTo.push(to)
      } else if (Array.isArray(to)) {
        to.forEach(toItem => {
          if (typeof toItem === 'string') {
            cleanTo.push(toItem)
          } else {
            cleanTo.push(toItem.address)
          }
        })
      }

      let fromToUse: string

      if (typeof from === 'string') {
        fromToUse = from
      } else if (typeof from === 'object' && 'name' in from && 'address' in from) {
        fromToUse = `${from.name} <${from.address}>`
      } else {
        fromToUse = `${fromName} <${fromAddress}>`
      }

      try {
        const sendResponse = await resend.sendEmail({
          from: fromToUse,
          to: cleanTo,
          subject: subject || '<No subject>',
          html: (html || text) as string,
        })

        if ('error' in sendResponse) {
          payload.logger.error({ msg: 'Error sending email', err: sendResponse.error })
        } else {
          payload.logger.info({ msg: 'Email sent', emailId: sendResponse.id })
        }
      } catch (err: unknown) {
        payload.logger.error({ msg: 'Unexpected error sending email', err })
      }
    },
  }

  return {
    fromName: fromName,
    fromAddress: fromAddress,
    transport: nodemailer.createTransport(transportConfig),
  }
}
