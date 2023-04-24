import { SendMailOptions } from 'nodemailer';

export default async function sendEmail(message: SendMailOptions): Promise<unknown> {
  let result;

  try {
    const email = await this.email;
    result = await email.transport.sendMail(message);
  } catch (err) {
    this.logger.error(
      `Failed to send mail to ${message.to}, subject: ${message.subject}`,
      err,
    );
    return err;
  }

  return result;
}
