const nodemailer = require('nodemailer');

const mockEmailHandler = async (emailConfig) => {
  const testAccount = await nodemailer.createTestAccount();

  const smtpOptions = {
    ...emailConfig,
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    fromName: 'John Doe',
    fromAddress: 'john.doe@payloadcms.com',
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

module.exports = mockEmailHandler;
