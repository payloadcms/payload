import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import payload from 'payload'
import type { EmailOptions } from 'payload/config'

type TransportArgs = Parameters<typeof nodemailer.createTransport>[0]

interface Args {
  fromName?: string
  fromAddress?: string
}

export const payloadCloudEmail = (args?: Args): EmailOptions | undefined => {
  if (process.env.PAYLOAD_CLOUD !== 'true') {
    return undefined
  }

  const resend = new Resend(process.env.PAYLOAD_CLOUD_RESEND_API_KEY)

  const defaultFromAddress = args?.fromAddress || `cms@${process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN}`
  const defaultFromName = args?.fromName || 'Payload CMS'

  const transportConfig: TransportArgs = {
    name: 'resend',
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
        fromToUse = `${defaultFromName} <${defaultFromAddress}>`
      }

      try {
        await resend.sendEmail({
          from: fromToUse,
          to: cleanTo,
          subject: subject || '<No subject>',
          html: (html || text) as string,
        })
      } catch (error: unknown) {
        if (error instanceof Error) {
          payload.logger.error(error.message)
        } else {
          payload.logger.error({ error })
        }
      }
    },
  }

  return {
    fromName: args?.fromName || defaultFromName,
    fromAddress: args?.fromAddress || defaultFromAddress,
    transport: nodemailer.createTransport(transportConfig),
  }
}
