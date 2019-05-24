import express from 'express';
import passport from 'passport';
import * as nodemailer from 'nodemailer';

const router = express.Router();
const emailRoutes = emailConfig => {

  router
    .route('')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => smtpEmailHandler(req, res, next, emailConfig)
    );

  return router;
};

const smtpEmailHandler = async (req, res, next, emailConfig) => {
  try {
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
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
