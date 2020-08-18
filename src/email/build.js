const nodemailer = require('nodemailer');
const mockHandler = require('./mockHandler');

async function buildEmail() {
  if (this.config.email.provider === 'mock') {
    const mockAccount = await mockHandler(this.config.email);
    return mockAccount;
  }

  return {
    transport: nodemailer.createTransport(this.config.email.transport),
    account: this.config.email,
  };
}


module.exports = buildEmail;
