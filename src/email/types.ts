import { TestAccount, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';

export type BuildEmailResult = Promise<{
  transport: Mail,
  transportOptions?: SMTPConnection.Options,
  fromName: string,
  fromAddress: string,
}>

export type MockEmailHandler = { account: TestAccount; transport: Transporter };
