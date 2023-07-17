import { SendMailOptions } from 'nodemailer';

export default async function sendEmail(message: SendMailOptions): Promise<unknown> {
  let result;

  try {
    const email = await this.email;
    result = await email.transport.sendMail(message);
  } catch (err) {
    this.logger.error(
      err,
      `Failed to send mail to ${message.to}, subject: ${message.subject}`,
    );
    return err;
  }

  return result;
}
