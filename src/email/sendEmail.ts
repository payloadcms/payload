import { Message } from './types';
import logger from '../utilities/logger';

export default async function sendEmail(message: Message): Promise<unknown> {
  let result;
  try {
    const email = await this.email;
    result = email.transport.sendMail(message);
  } catch (err) {
    logger.error(
      `Failed to send mail to ${message.to}, subject: ${message.subject}`,
      err,
    );
    return err;
  }
  return result;
}
