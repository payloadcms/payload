import { CollectionBeforeChangeHook } from 'payload/types';
import { serialize } from './utilities/serializeRichText';
import { SanitizedOptions } from './types';
import { replaceDoubleCurlys } from './utilities/replaceDoubleCurlys';

const sendEmail = (options: SanitizedOptions): CollectionBeforeChangeHook => async (args) => {
  const {
    data,
    data: {
      form: formID,
      submissionData
    } = {},
    req: {
      payload
    }
  } = args;

  const {
    sendEmail: sendEmailFromOptions,
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

      const formattedEmails = emails.map((email) => {
        const {
          message,
          subject,
          emailTo,
          emailFrom
        } = email;

        return ({
          to: replaceDoubleCurlys(emailTo, submissionData),
          from: replaceDoubleCurlys(emailFrom, submissionData),
          subject: replaceDoubleCurlys(subject, submissionData),
          html: `<div>${serialize(message, submissionData)}`
        });
      });

      if (typeof sendEmailFromOptions === 'function') {
        return sendEmailFromOptions(formattedEmails);
      } else {
        await Promise.all(
          formattedEmails.map((email) => payload.sendEmail(email))
        );

        return;
      }
    }
  } catch (err) {
    console.error(err);
  }

  return data;
};

export default sendEmail;
