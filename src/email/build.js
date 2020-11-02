const nodemailer = require('nodemailer');
const mockHandler = require('./mockHandler');

async function buildEmail() {
  if (!this.config.email || this.config.email.transport === 'mock') {
    const mockAccount = await mockHandler(this.config.email);
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
    console.error('There is an error with the email configuration you have provided.', err);
  }

  return email;
}


module.exports = buildEmail;
