import type { SendMailOptions } from 'nodemailer'

import type { Payload } from '../types/index.js'

export async function sendEmail(this: Payload, message: SendMailOptions): Promise<unknown> {
  let result

  try {
    result = await this.email.sendEmail(message)
  } catch (err: unknown) {
    let stringifiedTo: string | undefined

    if (typeof message.to === 'string') {
      stringifiedTo = message.to
    } else if (Array.isArray(message.to)) {
      stringifiedTo = message.to
        .map((to) => {
          if (typeof to === 'string') {
            return to
          } else if (to.address) {
            return to.address
          }
          return ''
        })
        .join(', ')
    } else if (message.to.address) {
      stringifiedTo = message.to.address
    }

    this.logger.error({
      err,
      msg: `Failed to send mail to ${stringifiedTo}, subject: ${message.subject ?? 'No Subject'}`,
    })
    return err
  }

  return result
}
