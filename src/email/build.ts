import nodemailer from 'nodemailer';
import mockHandler from './mockHandler';

async function buildEmail() {
  if (!this.config.email.transport || this.config.email.transport === 'mock') {
    this.logger.info('E-mail configured with mock configuration');
    const mockAccount = await mockHandler(this.config.email);
    if (this.config.email.transport === 'mock') {
      const { account: { web, user, pass } } = mockAccount;
      this.logger.info(`Log into mock email provider at ${web}`);
      this.logger.info(`Mock email account username: ${user}`);
      this.logger.info(`Mock email account password: ${pass}`);
    }
    return mockAccount;
  }

  const email = { ...this.config.email };

  if (this.config.email.transport) {
    email.transport = this.config.email.transport;
  }

  if (this.config.email.transportOptions) {
    email.transport = nodemailer.createTransport(this.config.email.transportOptions);
  }

  try {
    await email.transport.verify();
  } catch (err) {
    this.logger.error('There is an error with the email configuration you have provided.', err);
  }

  return email;
}


export default buildEmail;
