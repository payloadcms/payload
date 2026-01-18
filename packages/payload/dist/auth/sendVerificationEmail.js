import { URL } from 'url';
import { formatAdminURL } from '../utilities/formatAdminURL.js';
export async function sendVerificationEmail(args) {
    // Verify token from e-mail
    const { collection: { config: collectionConfig }, config, disableEmail, email, req, token, user } = args;
    if (!disableEmail) {
        const protocol = new URL(req.url).protocol // includes the final :
        ;
        const serverURL = config.serverURL !== null && config.serverURL !== '' ? config.serverURL : `${protocol}//${req.headers.get('host')}`;
        const verificationURL = formatAdminURL({
            adminRoute: config.routes.admin,
            path: `/${collectionConfig.slug}/verify/${token}`,
            serverURL
        });
        let html = `${req.t('authentication:newAccountCreated', {
            serverURL: config.serverURL,
            verificationURL
        })}`;
        const verify = collectionConfig.auth.verify;
        // Allow config to override email content
        if (typeof verify.generateEmailHTML === 'function') {
            html = await verify.generateEmailHTML({
                req,
                token,
                user
            });
        }
        let subject = req.t('authentication:verifyYourEmail');
        // Allow config to override email subject
        if (typeof verify.generateEmailSubject === 'function') {
            subject = await verify.generateEmailSubject({
                req,
                token,
                user
            });
        }
        await email.sendEmail({
            from: `"${email.defaultFromName}" <${email.defaultFromAddress}>`,
            html,
            subject,
            to: user.email
        });
    }
}

//# sourceMappingURL=sendVerificationEmail.js.map