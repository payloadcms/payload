import { serializeLexical } from '../../../utilities/lexical/serializeLexical.js';
import { replaceDoubleCurlys } from '../../../utilities/replaceDoubleCurlys.js';
import { serializeSlate } from '../../../utilities/slate/serializeSlate.js';
export const sendEmail = async (afterChangeParameters, formConfig)=>{
    if (afterChangeParameters.operation === 'create') {
        const { data, doc: { id: formSubmissionID }, req: { locale, payload }, req } = afterChangeParameters;
        const { form: formID, submissionData: submissionDataFromProps } = data || {};
        const { beforeEmail, defaultToEmail, formOverrides } = formConfig || {};
        try {
            const form = await payload.findByID({
                id: formID,
                collection: formOverrides?.slug || 'forms',
                locale,
                req
            });
            const emails = form.emails;
            const submissionData = [
                ...submissionDataFromProps,
                {
                    field: 'formSubmissionID',
                    value: String(formSubmissionID)
                }
            ];
            if (emails && emails.length) {
                const formattedEmails = await Promise.all(emails.map(async (email)=>{
                    const { bcc: emailBCC, cc: emailCC, emailFrom, emailTo: emailToFromConfig, message, replyTo: emailReplyTo, subject } = email;
                    const emailTo = emailToFromConfig || defaultToEmail || payload.email.defaultFromAddress;
                    const to = replaceDoubleCurlys(emailTo, submissionData);
                    const cc = emailCC ? replaceDoubleCurlys(emailCC, submissionData) : '';
                    const bcc = emailBCC ? replaceDoubleCurlys(emailBCC, submissionData) : '';
                    const from = replaceDoubleCurlys(emailFrom, submissionData);
                    const replyTo = replaceDoubleCurlys(emailReplyTo || emailFrom, submissionData);
                    const isLexical = message && !Array.isArray(message) && 'root' in message;
                    const serializedMessage = isLexical ? await serializeLexical(message, submissionData) : serializeSlate(message, submissionData);
                    return {
                        bcc,
                        cc,
                        from,
                        html: `<div>${serializedMessage}</div>`,
                        replyTo,
                        subject: replaceDoubleCurlys(subject, submissionData),
                        to
                    };
                }));
                let emailsToSend = formattedEmails;
                if (typeof beforeEmail === 'function') {
                    emailsToSend = await beforeEmail(formattedEmails, afterChangeParameters);
                }
                await Promise.all(emailsToSend.map(async (email)=>{
                    const { to } = email;
                    try {
                        const emailPromise = await payload.sendEmail(email);
                        return emailPromise;
                    } catch (err) {
                        payload.logger.error({
                            err,
                            msg: `Error while sending email to address: ${to}. Email not sent.`
                        });
                    }
                }));
            } else {
                payload.logger.info({
                    msg: 'No emails to send.'
                });
            }
        } catch (err) {
            const msg = `Error while sending one or more emails in form submission id: ${formSubmissionID}.`;
            payload.logger.error({
                err,
                msg
            });
        }
    }
};

//# sourceMappingURL=sendEmail.js.map