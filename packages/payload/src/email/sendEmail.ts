import type { SendMailOptions } from 'nodemailer'

import type { Payload } from '../types/index.js'

import { getStringifiedToAddress } from './getStringifiedToAddress.js'

export async function sendEmail(this: Payload, message: SendMailOptions): Promise<unknown> {
  let result

  try {
    result = await this.email.sendEmail(message)
  } catch (err: unknown) {
    const stringifiedTo = getStringifiedToAddress(message)

    this.logger.error({
      err,
      msg: `Failed to send mail to ${stringifiedTo}, subject: ${message.subject ?? 'No Subject'}`,
    })
    return err
  }

  return result
}
