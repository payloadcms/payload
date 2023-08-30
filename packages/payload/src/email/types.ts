import type { TestAccount, Transporter } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'

export type Message = {
  from: string
  html: string
  subject: string
  to: string
}

export type MockEmailHandler = { account: TestAccount; transport: Transporter }
export type BuildEmailResult = Promise<
  | {
      fromAddress: string
      fromName: string
      transport: Mail
      transportOptions?: SMTPConnection.Options
    }
  | MockEmailHandler
>
