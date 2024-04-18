import type { EmailAdapter, SendMailOptions } from 'payload/types'

export type ResendAdapterArgs = {
  defaultFromAddress: string
  defaultFromName: string
  resendApiKey: string
}

export type ResendAdapter = EmailAdapter<SendMailOptions, ResendResponse>

type ResendResponse =
  | {
      message: string
      name: string
      statusCode: number
    }
  | { id: string }

/**
 * Creates an email adapter using nodemailer
 *
 * If no email configuration is provided, an ethereal email test account is returned
 */
export const createResendAdapter = (args: ResendAdapterArgs): ResendAdapter => {
  const { defaultFromAddress, defaultFromName, resendApiKey } = args
  const adapter: ResendAdapter = {
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      // Map the Payload email options to Resend email options
      const sendEmailOptions = mapPayloadEmailToResendEmail(
        message,
        defaultFromAddress,
        defaultFromName,
      )

      const res = await fetch('https://api.resend.com/emails', {
        body: JSON.stringify(sendEmailOptions),
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = (await res.json()) as ResendResponse

      return data
    },
  }

  return adapter
}

function mapPayloadEmailToResendEmail(
  message: SendMailOptions,
  defaultFromAddress: string,
  defaultFromName: string,
): ResendSendEmailOptions {
  return {
    // Required
    from: mapFromAddress(message.from, defaultFromName, defaultFromAddress),
    subject: message.subject ?? '',
    to: mapAddresses(message.to),

    // Other To fields
    bcc: mapAddresses(message.bcc),
    cc: mapAddresses(message.cc),

    // Optional
    attachments: mapAttachments(message.attachments),
    html: message.html?.toString() || '',
    text: message.text?.toString() || '',
  }
}

function mapFromAddress(
  address: SendMailOptions['from'],
  defaultFromName: string,
  defaultFromAddress: string,
): ResendSendEmailOptions['from'] {
  if (!address) {
    return `${defaultFromName} <${defaultFromAddress}>`
  }

  if (typeof address === 'string') {
    return address
  }

  return `${address.name} <${address.address}>`
}

function mapAddresses(addresses: SendMailOptions['to']): ResendSendEmailOptions['to'] {
  if (!addresses) {
    return ''
  }

  if (typeof addresses === 'string') {
    return addresses
  }

  if (Array.isArray(addresses)) {
    return addresses.map((address) => (typeof address === 'string' ? address : address.address))
  }

  return [addresses.address]
}

function mapAttachments(
  attachments: SendMailOptions['attachments'],
): ResendSendEmailOptions['attachments'] {
  if (!attachments) {
    return []
  }

  return attachments.map((attachment) => {
    if (!attachment.filename || !attachment.content) {
      throw new Error('Attachment is missing filename or content')
    }

    if (typeof attachment.content === 'string') {
      return {
        content: Buffer.from(attachment.content),
        filename: attachment.filename,
      }
    }

    if (attachment.content instanceof Buffer) {
      return {
        content: attachment.content,
        filename: attachment.filename,
      }
    }

    throw new Error('Attachment content must be a string or a buffer')
  })
}

type ResendSendEmailOptions = {
  /**
   * Filename and content of attachments (max 40mb per email)
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  attachments?: Attachment[]
  /**
   * Blind carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  bcc?: string | string[]

  /**
   * Carbon copy recipient email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  cc?: string | string[]
  /**
   * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  from: string
  /**
   * Custom headers to add to the email.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  headers?: Record<string, string>
  /**
   * The HTML version of the message.
   *
   * @link https://resend.com/api-reference/emails/send-email#body-parameters
   */
  html?: string
  /**
   * Reply-to email address. For multiple addresses, send as an array of strings.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  reply_to?: string | string[]
  /**
   * Email subject.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  subject: string
  /**
   * Email tags
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  tags?: Tag[]
  /**
   * The plain text version of the message.
   *
   * @link https://resend.com/api-reference/emails/send-email#body-parameters
   */
  text?: string
  /**
   * Recipient email address. For multiple addresses, send as an array of strings. Max 50.
   *
   * @link https://resend.com/docs/api-reference/emails/send-email#body-parameters
   */
  to: string | string[]
}

type Attachment = {
  /** Content of an attached file. */
  content?: Buffer | string
  /** Name of attached file. */
  filename?: false | string | undefined
  /** Path where the attachment file is hosted */
  path?: string
}

export type Tag = {
  /**
   * The name of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
   */
  name: string
  /**
   * The value of the email tag. It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (_), or dashes (-). It can contain no more than 256 characters.
   */
  value: string
}
