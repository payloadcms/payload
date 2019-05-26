import express from 'express';
import passport from 'passport';
import * as nodemailer from 'nodemailer';

const router = express.Router();
const emailRoutes = emailConfig => {

  router
    .route('')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => getEmailHandler(req, res, next, emailConfig)
    );

  return router;
};

const getEmailHandler = (req, res, next, emailConfig) => {
  switch (emailConfig.provider) {
    case 'mock':
      return mockEmailHandler(req, res, next, emailConfig);
    case 'smtp':
      return smtpEmailHandler(req, res, next, emailConfig);
    default:
      throw new Error('Invalid e-mail configuration');
  }
};

const mockEmailHandler = async (req, res, next, emailConfig) => {
  let testAccount = await nodemailer.createTestAccount();
  process.env.EMAIL_USER = testAccount.user;
  process.env.EMAIL_PASS = testAccount.pass;
  emailConfig.host = 'smtp.ethereal.email';
  emailConfig.port = 587;
  emailConfig.secure = false;
  emailConfig.fromName = 'John Doe';
  emailConfig.fromAddress = 'john.doe@payloadcms.com';
  return smtpEmailHandler(req, res, next, emailConfig);
};

const smtpEmailHandler = async (req, res, next, emailConfig) => {
  try {
    let transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // send mail with defined transport object
    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
      to: req.body.toAddress,
      subject: req.body.subject || 'Password Reset',
      text: req.body.text || '',
    });

    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.status(500).json({success: false, error: 'Unable to send e-mail'});
  }

};

export default emailRoutes;
