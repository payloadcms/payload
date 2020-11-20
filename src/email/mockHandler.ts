import nodemailer from 'nodemailer';

const mockEmailHandler = async (emailConfig) => {
  const testAccount = await nodemailer.createTestAccount();

  const smtpOptions = {
    ...emailConfig,
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    fromName: emailConfig.fromName || 'Payload CMS',
    fromAddress: emailConfig.fromAddress || 'info@payloadcms.com',
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };

  return {
    account: testAccount,
    transport: nodemailer.createTransport(smtpOptions),
  };
};

export default mockEmailHandler;
