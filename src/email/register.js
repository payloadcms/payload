const nodemailer = require('nodemailer');
const mockHandler = require('./mockHandler');

function registerEmailService() {
  const emailHandler = this.config.email.provider === 'smtp'
    ? nodemailer.createTransport(this.config.email)
    : mockHandler(this.config.email);

  this.email = emailHandler;
}


module.exports = registerEmailService;
