import type { SendMailOptions } from 'nodemailer'

export type { SendMailOptions }

export type EmailAdapter<
  TSendEmailOptions extends SendMailOptions,
  KSendEmailResponse = unknown,
> = {
  defaultFromAddress: string
  defaultFromName: string
  sendEmail: (message: TSendEmailOptions) => Promise<KSendEmailResponse>
}
