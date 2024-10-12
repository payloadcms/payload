import type { Email, FormattedEmail, PluginConfig } from '../../../types'

import { serializeLexical } from '../../../utilities/lexical/serializeLexical'
import { replaceDoubleCurlys } from '../../../utilities/replaceDoubleCurlys'
import { serializeSlate } from '../../../utilities/slate/serializeSlate'

const sendEmail = async (beforeChangeData: any, formConfig: PluginConfig): Promise<any> => {
  const { data, operation, req } = beforeChangeData

  if (operation === 'create') {
    const {
      data: { id: formSubmissionID },
      req: { locale, payload },
    } = beforeChangeData

    const { form: formID, submissionData } = data || {}

    const { beforeEmail, formOverrides } = formConfig || {}

    try {
      const form = await payload.findByID({
        id: formID,
        collection: formOverrides?.slug || 'forms',
        locale,
        req,
      })

      const { emails } = form

      if (emails && emails.length) {
        const formattedEmails: FormattedEmail[] = await Promise.all(
          emails.map(async (email: Email): Promise<FormattedEmail | null> => {
            const {
              bcc: emailBCC,
              cc: emailCC,
              emailFrom,
              emailTo,
              message,
              replyTo: emailReplyTo,
              subject,
            } = email

            const to = replaceDoubleCurlys(emailTo, submissionData)
            const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : ''
            const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : ''
            const from = replaceDoubleCurlys(emailFrom, submissionData)
            const replyTo = replaceDoubleCurlys(emailReplyTo || emailFrom, submissionData)

            const isLexical = message && !Array.isArray(message) && 'root' in message

            const serializedMessage = isLexical
              ? await serializeLexical(message, submissionData)
              : serializeSlate(message, submissionData)

            return {
              bcc,
              cc,
              from,
              html: `<div>${serializedMessage}</div>`,
              replyTo,
              subject: replaceDoubleCurlys(subject, submissionData),
              to,
            }
          }),
        )

        let emailsToSend = formattedEmails

        if (typeof beforeEmail === 'function') {
          emailsToSend = await beforeEmail(formattedEmails, payload, {form, submissionData})
        }

        // const log = emailsToSend.map(({ html, ...rest }) => ({ ...rest }))

        await Promise.all(
          emailsToSend.map(async (email) => {
            const { to } = email
            try {
              const emailPromise = await payload.sendEmail(email)
              return emailPromise
            } catch (err: unknown) {
              payload.logger.error({
                err: `Error while sending email to address: ${to}. Email not sent: ${JSON.stringify(
                  err,
                )}`,
              })
            }
          }),
        )
      } else {
        payload.logger.info({ msg: 'No emails to send.' })
      }
    } catch (err: unknown) {
      const msg = `Error while sending one or more emails in form submission id: ${formSubmissionID}.`
      payload.logger.error({ err: msg })
    }
  }

  return data
}

export default sendEmail
