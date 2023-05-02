import { TestAccount, Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
export type Message = {
    from: string;
    to: string;
    subject: string;
    html: string;
};
export type MockEmailHandler = {
    account: TestAccount;
    transport: Transporter;
};
export type BuildEmailResult = Promise<{
    transport: Mail;
    transportOptions?: SMTPConnection.Options;
    fromName: string;
    fromAddress: string;
} | MockEmailHandler>;
