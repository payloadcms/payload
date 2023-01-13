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
        payload
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
              emailFromName,
              replyTo: emailReplyTo,
              replyToName,
            } = email;

            const to = replaceDoubleCurlys(emailTo, submissionData);
            const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : '';
            const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : '';
            const from = replaceDoubleCurlys(emailFromName ? `"${emailFromName}" ` + emailFrom : emailFrom, submissionData);
            const replyTo = replaceDoubleCurlys(replyToName ? `"${replyToName}" ` + emailReplyTo : emailReplyTo || emailFrom, submissionData);

            if (to && from) {
              return ({
                to,
                from,
                cc,
                bcc,
                replyTo,
                subject: replaceDoubleCurlys(subject, submissionData),
                html: `<div>${serialize(message, submissionData)}</div>`
              });
            }
            return null
          }).filter(Boolean);

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
              } catch (err) {
                console.error(`Error while sending email to address: ${to}. Email not sent.`);
                console.error(err);
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
