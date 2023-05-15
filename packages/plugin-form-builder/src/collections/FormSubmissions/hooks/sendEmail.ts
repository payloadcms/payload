import { serialize } from '../../../utilities/serializeRichText';
import { Email, FormattedEmail, PluginConfig } from '../../../types';
import { replaceDoubleCurlys } from '../../../utilities/replaceDoubleCurlys';

const sendEmail = async (beforeChangeData: any, formConfig: PluginConfig) => {
  const {
    operation,
    data
  } = beforeChangeData;

  if (operation === 'create') {
    const {
      data: {
        id: formSubmissionID
      },
      req: {
        payload,
        locale
      }
    } = beforeChangeData;

    const {
      form: formID,
      submissionData
    } = data || {};

    const {
      beforeEmail,
      formOverrides
    } = formConfig || {};

    try {
      const form = await payload.findByID({
        id: formID,
        collection: formOverrides?.slug || 'forms',
        locale
      });

      if (form) {
        const {
          emails,
        } = form;

        if (emails) {
          const formattedEmails: FormattedEmail[] = emails.map((email: Email): FormattedEmail | null => {
            const {
              message,
              subject,
              emailTo,
              cc: emailCC,
              bcc: emailBCC,
              emailFrom,
              replyTo: emailReplyTo,
            } = email;

            const to = replaceDoubleCurlys(emailTo, submissionData);
            const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : '';
            const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : '';
            const from = replaceDoubleCurlys(emailFrom, submissionData);
            const replyTo = replaceDoubleCurlys(emailReplyTo || emailFrom, submissionData);

            return ({
              to,
              from,
              cc,
              bcc,
              replyTo,
              subject: replaceDoubleCurlys(subject, submissionData),
              html: `<div>${serialize(message, submissionData)}</div>`
            });
          });

          let emailsToSend = formattedEmails

          if (typeof beforeEmail === 'function') {
            emailsToSend = await beforeEmail(formattedEmails);
          }

          const log = emailsToSend.map(({ html, ...rest }) => ({ ...rest }))

          await Promise.all(
            emailsToSend.map(async (email) => {
              const { to } = email;
              try {
                const emailPromise = await payload.sendEmail(email);
                return emailPromise;
              } catch (err: any) {
                console.error(`Error while sending email to address: ${to}. Email not sent.`);
                if (err?.response?.body?.errors) {
                  const error = err.response.body.errors?.[0];
                  console.log('%s: %s', error?.field, error?.message);
                } else {
                  console.log(err);
                }
              }
            })
          );
        }
      } else {
        console.log('No emails to send.')
      }
    } catch (err) {
      console.error(`Error while sending one or more emails in form submission id: ${formSubmissionID}.`);
      console.error(err);
    }
  }

  return data;
};

export default sendEmail;