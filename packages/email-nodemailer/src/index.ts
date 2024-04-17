/* eslint-disable no-console */
import type { SendMailOptions, Transporter } from 'nodemailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'
import type { EmailAdapter } from 'payload/types'

import nodemailer from 'nodemailer'
import { InvalidConfiguration } from 'payload/errors'

type Email = {
  defaultFromAddress: string
  defaultFromName: string
  logMockCredentials?: boolean
}

type EmailTransportOptions = Email & {
  transport?: Transporter
  transportOptions: SMTPConnection.Options
}

export type NodemailerAdapterArgs = Email | EmailTransportOptions
export type NodemailerAdapter = EmailAdapter<SendMailOptions, unknown>

/**
 * Creates an email adapter using nodemailer
 *
 * If no email configuration is provided, an ethereal email test account is returned
 */
export const createNodemailerAdapter = async (
  args?: NodemailerAdapterArgs,
): Promise<NodemailerAdapter> => {
  const { defaultFromAddress, defaultFromName, transport } = await buildEmail(args)

  const adapter: NodemailerAdapter = {
    defaultFromAddress,
    defaultFromName,
    sendEmail: async (message) => {
      return await transport.sendMail({
        from: `${defaultFromName} <${defaultFromAddress}>`,
        ...message,
      })
    },
  }

  return adapter
}

async function buildEmail(
  emailConfig?: NodemailerAdapterArgs,
): Promise<{ defaultFromAddress: string; defaultFromName: string; transport: Transporter }> {
  if (!emailConfig) {
    return {
      defaultFromAddress: 'info@payloadcms.com',
      defaultFromName: 'Payload',
      transport: await createMockAccount(emailConfig),
    }
  }

  ensureConfigHasFrom(emailConfig)

  // Create or extract transport
  let transport: Transporter
  if ('transport' in emailConfig && emailConfig.transport) {
    ;({ transport } = emailConfig)
  } else if ('transportOptions' in emailConfig && emailConfig.transportOptions) {
    transport = nodemailer.createTransport(emailConfig.transportOptions)
  } else {
    transport = await createMockAccount(emailConfig)
  }

  await verifyTransport(transport)
  return {
    defaultFromAddress: emailConfig.defaultFromAddress,
    defaultFromName: emailConfig.defaultFromName,
    transport,
  }
}

async function verifyTransport(transport: Transporter) {
  try {
    await transport.verify()
  } catch (err: unknown) {
    console.error({ err, msg: 'Error verifying Nodemailer transport.' })
  }
}

const ensureConfigHasFrom = (emailConfig: NodemailerAdapterArgs) => {
  if (!emailConfig?.defaultFromName || !emailConfig?.defaultFromAddress) {
    throw new InvalidConfiguration(
      'Email fromName and fromAddress must be configured when transport is configured',
    )
  }
}

/**
 * Use ethereal.email to create a mock email account
 */
async function createMockAccount(emailConfig: NodemailerAdapterArgs) {
  try {
    const etherealAccount = await nodemailer.createTestAccount()

    const smtpOptions = {
      ...emailConfig,
      auth: {
        pass: etherealAccount.pass,
        user: etherealAccount.user,
      },
      fromAddress: emailConfig?.defaultFromAddress,
      fromName: emailConfig?.defaultFromName,
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
    }
    const transport = nodemailer.createTransport(smtpOptions)
    const { pass, user, web } = etherealAccount

    if (emailConfig?.logMockCredentials) {
      console.info('E-mail configured with mock configuration')
      console.info(`Log into mock email provider at ${web}`)
      console.info(`Mock email account username: ${user}`)
      console.info(`Mock email account password: ${pass}`)
    }
    return transport
  } catch (err) {
    console.error({ err, msg: 'There was a problem setting up the mock email handler' })
  }
}
