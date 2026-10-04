import type { EmailAdapter, SendEmailOptions } from 'payload'

/**
 * Sends Payload's emails (e.g. "forgot password") through the SendGrid Web API v3. Enabled when
 * SENDGRID_API_KEY is set; without it Payload only writes emails to the server log.
 *
 *   SENDGRID_API_KEY    an API key with the "Mail Send" permission
 *   EMAIL_FROM_ADDRESS  a sender verified in SendGrid (Single Sender or an authenticated domain)
 *   EMAIL_FROM_NAME     optional, defaults to "Payload CMS"
 *   SENDGRID_API_URL    optional, e.g. https://api.eu.sendgrid.com for EU data residency
 */
export const sendgridAdapter = (): EmailAdapter | undefined => {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return undefined
  }

  const apiURL = (process.env.SENDGRID_API_URL || 'https://api.sendgrid.com').replace(/\/+$/, '')
  const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || ''
  const defaultFromName = process.env.EMAIL_FROM_NAME || 'Payload CMS'

  return () => ({
    defaultFromAddress,
    defaultFromName,
    name: 'sendgrid',
    sendEmail: async (message: SendEmailOptions) => {
      const [from] = toAddresses({ value: message.from })
      const replyTo = toAddresses({ value: message.replyTo })[0]

      const res = await fetch(`${apiURL}/v3/mail/send`, {
        body: JSON.stringify({
          content: [
            ...(message.text ? [{ type: 'text/plain', value: String(message.text) }] : []),
            ...(message.html ? [{ type: 'text/html', value: String(message.html) }] : []),
          ],
          from: from ?? { email: defaultFromAddress, name: defaultFromName },
          personalizations: [
            {
              bcc: nonEmpty(toAddresses({ value: message.bcc })),
              cc: nonEmpty(toAddresses({ value: message.cc })),
              to: toAddresses({ value: message.to }),
            },
          ],
          ...(replyTo && { reply_to: replyTo }),
          subject: message.subject || '(no subject)',
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: AbortSignal.timeout(15_000),
      })

      // SendGrid answers 202 Accepted with an empty body
      if (!res.ok) {
        throw new Error(`SendGrid rejected the email (${res.status}): ${await res.text()}`)
      }

      return { messageID: res.headers.get('x-message-id') }
    },
  })
}

type Address = { email: string; name?: string }

/** Turns nodemailer-style recipients ("a@b.c", "Name <a@b.c>", { name, address }, lists) into SendGrid's */
const toAddresses = ({ value }: { value: unknown }): Address[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => toAddresses({ value: item }))
  }

  if (typeof value === 'object' && 'address' in value) {
    const { address, name } = value as { address: string; name?: string }
    return [{ email: address, ...(name && { name }) }]
  }

  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^"?([^"<]*?)"?\s*<([^>]+)>$/)
      return match
        ? { email: match[2]!.trim(), ...(match[1]!.trim() && { name: match[1]!.trim() }) }
        : { email: part }
    })
}

const nonEmpty = (addresses: Address[]) => (addresses.length > 0 ? addresses : undefined)
