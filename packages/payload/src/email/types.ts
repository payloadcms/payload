import type { SendMailOptions as NodemailerSendMailOptions } from 'nodemailer'

import type { Payload } from '../types/index.js'

type Prettify<T> = {
  [K in keyof T]: T[K]
} & NonNullable<unknown>

/**
 * Options for sending an email. Allows access to the PayloadRequest object
 */
export type SendEmailOptions = Prettify<NodemailerSendMailOptions>

/**
 * Email adapter after it has been initialized. This is used internally by Payload.
 */
export type InitializedEmailAdapter<TSendEmailResponse = unknown> = ReturnType<
  EmailAdapter<TSendEmailResponse>
>

/**
 * Email adapter interface. Allows a generic type for the response of the sendEmail method.
 *
 * This is the interface to use if you are creating a new email adapter.
 */

export type EmailAdapter<TSendEmailResponse = unknown> = ({ payload }: { payload: Payload }) => {
  defaultFromAddress: string
  defaultFromName: string
  name: string
  sendEmail: (message: SendEmailOptions) => Promise<TSendEmailResponse>
}
