import { serialize } from '../utilities/serializeRichText';
import { Email, SanitizedOptions } from '../types';
import { replaceDoubleCurlys } from '../utilities/replaceDoubleCurlys';

const sendEmail = async (beforeChangeData, options: SanitizedOptions) => {
  const {
    data,
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
    formsOverrides
  } = options || {};

  try {
    const form = await payload.findByID({
      id: formID,
      collection: formsOverrides?.slug || 'forms',
    });

    if (form) {
      const {
        emails,
      } = form;

      if (emails) {
        const formattedEmails = emails.map((email: Email) => {
          const {
            message,
            subject,
            emailTo,
            emailFrom
          } = email;

          const to = replaceDoubleCurlys(emailTo, submissionData);
          const from = replaceDoubleCurlys(emailFrom, submissionData);

          if (to && from) {
            return ({
              to,
              from,
              subject: replaceDoubleCurlys(subject, submissionData),
              html: `<div>${serialize(message, submissionData)}`
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

  return data;
};

export default sendEmail;
