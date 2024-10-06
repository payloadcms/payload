import type { SendMailOptions } from 'nodemailer';

export default async function sendEmail(message: SendMailOptions): Promise<unknown> {
  let result;

  try {
    const email = await this.email;
    result = await email.transport.sendMail(message);
  } catch (err) {
    this.logger.error(err, `Failed to send mail to ${message.to}, subject: ${message.subject}`);
    throw err; // Throw the error instead of returning it
  }

  return result;
}
