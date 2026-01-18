/* eslint-disable no-console */ import nodemailer from 'nodemailer';
import { InvalidConfiguration } from 'payload';
/**
 * Creates an email adapter using nodemailer
 *
 * If no email configuration is provided, an ethereal email test account is returned
 */ export const nodemailerAdapter = async (args)=>{
    const { defaultFromAddress, defaultFromName, transport } = await buildEmail(args);
    const adapter = ()=>({
            name: 'nodemailer',
            defaultFromAddress,
            defaultFromName,
            sendEmail: async (message)=>{
                return await transport.sendMail({
                    from: `${defaultFromName} <${defaultFromAddress}>`,
                    ...message
                });
            }
        });
    return adapter;
};
async function buildEmail(emailConfig) {
    if (!emailConfig) {
        const transport = await createMockAccount(emailConfig);
        if (!transport) {
            throw new InvalidConfiguration('Unable to create Nodemailer test account.');
        }
        return {
            defaultFromAddress: 'info@payloadcms.com',
            defaultFromName: 'Payload',
            transport
        };
    }
    // Create or extract transport
    let transport;
    if ('transport' in emailConfig && emailConfig.transport) {
        ;
        ({ transport } = emailConfig);
    } else if ('transportOptions' in emailConfig && emailConfig.transportOptions) {
        transport = nodemailer.createTransport(emailConfig.transportOptions);
    } else {
        transport = await createMockAccount(emailConfig);
    }
    if (!emailConfig.skipVerify) {
        await verifyTransport(transport);
    }
    return {
        defaultFromAddress: emailConfig.defaultFromAddress,
        defaultFromName: emailConfig.defaultFromName,
        transport
    };
}
async function verifyTransport(transport) {
    try {
        await transport.verify();
    } catch (err) {
        console.error({
            err,
            msg: 'Error verifying Nodemailer transport.'
        });
    }
}
/**
 * Use ethereal.email to create a mock email account
 */ async function createMockAccount(emailConfig) {
    try {
        const etherealAccount = await nodemailer.createTestAccount();
        const smtpOptions = {
            ...emailConfig || {},
            auth: {
                pass: etherealAccount.pass,
                user: etherealAccount.user
            },
            fromAddress: emailConfig?.defaultFromAddress,
            fromName: emailConfig?.defaultFromName,
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false
        };
        const transport = nodemailer.createTransport(smtpOptions);
        const { pass, user, web } = etherealAccount;
        console.info('E-mail configured with ethereal.email test account. ');
        console.info(`Log into mock email provider at ${web}`);
        console.info(`Mock email account username: ${user}`);
        console.info(`Mock email account password: ${pass}`);
        return transport;
    } catch (err) {
        if (err instanceof Error) {
            console.error({
                err,
                msg: 'There was a problem setting up the mock email handler'
            });
            throw new InvalidConfiguration(`Unable to create Nodemailer test account. Error: ${err.message}`);
        }
        throw new InvalidConfiguration('Unable to create Nodemailer test account.');
    }
}

//# sourceMappingURL=index.js.map