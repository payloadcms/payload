const nodemailer = require('nodemailer');
const mockHandler = require('./mockHandler');

async function buildEmail() {
  if (this.config.email.transport === 'mock') {
    const mockAccount = await mockHandler(this.config.email);
    return mockAccount;
  }

  const email = {
    transport: nodemailer.createTransport(this.config.email.transport),
    account: this.config.email,
  };

  try {
    await email.transport.verify();
  } catch (err) {
    console.error('There is an error with the email configuration you have provided.', err);
  }

  return email;
}


module.exports = buildEmail;
