import type { Email, FormattedEmail, PluginConfig } from '../../../types'
import { replaceDoubleCurlys } from '../../../utilities/replaceDoubleCurlys'
import { serialize } from '../../../utilities/serializeRichText'

const sendEmail = async (beforeChangeData: any, formConfig: PluginConfig): Promise<any> => {
  const { operation, data } = beforeChangeData

  if (operation === 'create') {
    const {
      data: { id: formSubmissionID },
      req: { payload, locale },
    } = beforeChangeData

    const { form: formID, submissionData } = data || {}

    const { beforeEmail, formOverrides } = formConfig || {}

    try {
      const form = await payload.findByID({
        id: formID,
        collection: formOverrides?.slug || 'forms',
        locale,
      })

      const { emails } = form

      if (emails && emails.length) {
        const formattedEmails: FormattedEmail[] = emails.map(
          (email: Email): FormattedEmail | null => {
            const {
              message,
              subject,
              emailTo,
              cc: emailCC,
              bcc: emailBCC,
              emailFrom,
              replyTo: emailReplyTo,
            } = email

            const to = replaceDoubleCurlys(emailTo, submissionData)
            const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : ''
            const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : ''
            const from = replaceDoubleCurlys(emailFrom, submissionData)
            const replyTo = replaceDoubleCurlys(emailReplyTo || emailFrom, submissionData)

            return {
              to,
              from,
              cc,
              bcc,
              replyTo,
              subject: replaceDoubleCurlys(subject, submissionData),
              html: `<div>${serialize(message, submissionData)}</div>`,
            }
          },
        )

        let emailsToSend = formattedEmails

        if (typeof beforeEmail === 'function') {
          emailsToSend = await beforeEmail(formattedEmails)
        }

        // const log = emailsToSend.map(({ html, ...rest }) => ({ ...rest }))

        await Promise.all(
          emailsToSend.map(async email => {
            const { to } = email
            try {
              const emailPromise = await payload.sendEmail(email)
              return emailPromise
            } catch (err: unknown) {
              payload.logger.error({
                err: `Error while sending email to address: ${to}. Email not sent: ${err}`,
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
