import type { NodemailerAdapterArgs } from '@payloadcms/email-nodemailer'

import { expect, test } from 'tstyche'

test('should accept SMTP auth credentials in transportOptions', () => {
  expect({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'Example',
    transportOptions: {
      auth: { pass: 'pass', user: 'user' },
      host: 'smtp.example.com',
      port: 587,
    },
  }).type.toBeAssignableTo<NodemailerAdapterArgs>()
})

test('should reject a transport typed by @types/nodemailer', () => {
  // Same shape as a nodemailer 9 Transporter. Its mail options are not assignable to nodemailer 10's
  // in either direction: v9 allows an address object for inReplyTo, v10 allows `path: false`.
  type TypesNodemailerMailOptions = {
    attachments?: { path?: { href: string } | string }[]
    inReplyTo?: { address: string; name: string } | string
  }
  type TypesNodemailerTransport = {
    _defaults: TypesNodemailerMailOptions
    sendMail(mailOptions: TypesNodemailerMailOptions): Promise<unknown>
    verify(): Promise<true>
  }

  expect({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'Example',
    transport: {} as TypesNodemailerTransport,
  }).type.not.toBeAssignableTo<NodemailerAdapterArgs>()
})
