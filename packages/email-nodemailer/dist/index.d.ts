import type { Transporter } from 'nodemailer';
import type SMTPConnection from 'nodemailer/lib/smtp-connection';
import type { EmailAdapter } from 'payload';
export type NodemailerAdapterArgs = {
    defaultFromAddress: string;
    defaultFromName: string;
    skipVerify?: boolean;
    transport?: Transporter;
    transportOptions?: SMTPConnection.Options;
};
type NodemailerAdapter = EmailAdapter<unknown>;
/**
 * Creates an email adapter using nodemailer
 *
 * If no email configuration is provided, an ethereal email test account is returned
 */
export declare const nodemailerAdapter: (args?: NodemailerAdapterArgs) => Promise<NodemailerAdapter>;
export {};
//# sourceMappingURL=index.d.ts.map