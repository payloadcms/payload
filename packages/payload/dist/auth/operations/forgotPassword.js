import crypto from 'crypto';
import { status as httpStatus } from 'http-status';
import { URL } from 'url';
import { buildAfterOperation } from '../../collections/operations/utilities/buildAfterOperation.js';
import { buildBeforeOperation } from '../../collections/operations/utilities/buildBeforeOperation.js';
import { APIError } from '../../errors/index.js';
import { Forbidden } from '../../index.js';
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js';
import { commitTransaction } from '../../utilities/commitTransaction.js';
import { formatAdminURL } from '../../utilities/formatAdminURL.js';
import { initTransaction } from '../../utilities/initTransaction.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { getLoginOptions } from '../getLoginOptions.js';
export const forgotPasswordOperation = async (incomingArgs)=>{
    const loginWithUsername = incomingArgs.collection.config.auth.loginWithUsername;
    const { data } = incomingArgs;
    const { canLoginWithEmail, canLoginWithUsername } = getLoginOptions(loginWithUsername);
    const sanitizedEmail = canLoginWithEmail && (incomingArgs.data.email || '').toLowerCase().trim() || null;
    const sanitizedUsername = 'username' in data && typeof data?.username === 'string' ? data.username.toLowerCase().trim() : null;
    let args = incomingArgs;
    if (incomingArgs.collection.config.auth.disableLocalStrategy) {
        throw new Forbidden(incomingArgs.req.t);
    }
    if (!sanitizedEmail && !sanitizedUsername) {
        throw new APIError(`Missing ${loginWithUsername ? 'username' : 'email'}.`, httpStatus.BAD_REQUEST);
    }
    try {
        const shouldCommit = await initTransaction(args.req);
        // /////////////////////////////////////
        // beforeOperation - Collection
        // /////////////////////////////////////
        args = await buildBeforeOperation({
            args,
            collection: args.collection.config,
            operation: 'forgotPassword'
        });
        const { collection: { config: collectionConfig }, disableEmail, expiration, req: { payload: { config, email }, payload }, req } = args;
        // /////////////////////////////////////
        // Forget password
        // /////////////////////////////////////
        let token = crypto.randomBytes(20).toString('hex');
        if (!sanitizedEmail && !sanitizedUsername) {
            throw new APIError(`Missing ${loginWithUsername ? 'username' : 'email'}.`, httpStatus.BAD_REQUEST);
        }
        let whereConstraint = {};
        if (canLoginWithEmail && sanitizedEmail) {
            whereConstraint = {
                email: {
                    equals: sanitizedEmail
                }
            };
        } else if (canLoginWithUsername && sanitizedUsername) {
            whereConstraint = {
                username: {
                    equals: sanitizedUsername
                }
            };
        }
        // Exclude trashed users unless `trash: true`
        whereConstraint = appendNonTrashedFilter({
            enableTrash: collectionConfig.trash,
            trash: false,
            where: whereConstraint
        });
        let user = await payload.db.findOne({
            collection: collectionConfig.slug,
            req,
            where: whereConstraint
        });
        // We don't want to indicate specifically that an email was not found,
        // as doing so could lead to the exposure of registered emails.
        // Therefore, we prefer to fail silently.
        if (!user) {
            await commitTransaction(args.req);
            return null;
        }
        const resetPasswordExpiration = new Date(Date.now() + (collectionConfig.auth?.forgotPassword?.expiration ?? expiration ?? 3600000)).toISOString();
        user = await payload.update({
            id: user.id,
            collection: collectionConfig.slug,
            data: {
                resetPasswordExpiration,
                resetPasswordToken: token
            },
            req
        });
        if (!disableEmail && user.email) {
            const protocol = new URL(req.url).protocol // includes the final :
            ;
            const serverURL = config.serverURL !== null && config.serverURL !== '' ? config.serverURL : `${protocol}//${req.headers.get('host')}`;
            const forgotURL = formatAdminURL({
                adminRoute: config.routes.admin,
                path: `${config.admin.routes.reset}/${token}`,
                serverURL
            });
            let html = `${req.t('authentication:youAreReceivingResetPassword')}
    <a href="${forgotURL}">${forgotURL}</a>
    ${req.t('authentication:youDidNotRequestPassword')}`;
            if (typeof collectionConfig.auth.forgotPassword?.generateEmailHTML === 'function') {
                html = await collectionConfig.auth.forgotPassword.generateEmailHTML({
                    req,
                    token,
                    user
                });
            }
            let subject = req.t('authentication:resetYourPassword');
            if (typeof collectionConfig.auth.forgotPassword?.generateEmailSubject === 'function') {
                subject = await collectionConfig.auth.forgotPassword.generateEmailSubject({
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
        // /////////////////////////////////////
        // afterForgotPassword - Collection
        // /////////////////////////////////////
        if (collectionConfig.hooks?.afterForgotPassword?.length) {
            for (const hook of collectionConfig.hooks.afterForgotPassword){
                await hook({
                    args,
                    collection: args.collection?.config,
                    context: req.context
                });
            }
        }
        // /////////////////////////////////////
        // afterOperation - Collection
        // /////////////////////////////////////
        token = await buildAfterOperation({
            args,
            collection: args.collection?.config,
            operation: 'forgotPassword',
            result: token
        });
        if (shouldCommit) {
            await commitTransaction(req);
        }
        return token;
    } catch (error) {
        await killTransaction(args.req);
        throw error;
    }
};

//# sourceMappingURL=forgotPassword.js.map