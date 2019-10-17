import express from 'express';
import passport from 'passport';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

const router = express.Router();
const passwordResetRoutes = (emailConfig, User) => {

  router
    .route('/forgot')
    .post(
      passport.authenticate('jwt', { session: false }),
      (req, res, next) => validateForgotRequestBody(req, res, next),
      (req, res, next) => sendResetEmail(req, res, next, emailConfig, User)
    );

  router
    .route('/reset/:token')
    .get(
      // Front-end can prefill the form then make a call to /reset
      (req, res) => checkTokenValidity(req, res, User)
    );

  router
    .route('/reset')
    .post(
      (req, res, next) => validateResetPasswordBody(req, res, next),
      (req, res) => resetPassword(req, res, User)
    );

  return router;
};

const sendResetEmail = async (req, res, next, emailConfig, User) => {
  let emailHandler;

  try {
    switch (emailConfig.provider) {
      case 'mock':
        emailHandler = await mockEmailHandler(req, res, next, emailConfig);
        break;
      case 'smtp':
        emailHandler = smtpEmailHandler(req, res, next, emailConfig);
        break;
      default:
        emailHandler = await mockEmailHandler(req, res, next, emailConfig);
    }

    const generateToken = () => new Promise(resolve =>
      crypto.randomBytes(20, (err, buffer) =>
        resolve(buffer.toString('hex'))
      ));

    let token = await generateToken();

    User.findOne({ email: req.body.userEmail }, (err, user) => {
      if (!user) {
        const message = `No account with email ${req.body.userEmail} address exists.`;
        return res.status(400).json({ message: message })
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpiration = Date.now() + 3600000; // 1 hour
      user.save(async (saveError) => {
        if (saveError) {
          const message = 'Error saving temporary reset token';
          console.error(message, saveError);
          res.status(500).json({ message });
        }
        console.log('Temporary reset token created and saved to DB');


        const emailText = `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                           Please click on the following link, or paste this into your browser to complete the process:
                           ${req.protocol}://${req.headers.host}/reset/${token}
                           If you did not request this, please ignore this email and your password will remain unchanged.`;

        await emailHandler.sendMail({
          from: `"${emailConfig.fromName}" <${emailConfig.fromAddress}>`,
          to: req.body.userEmail,
          subject: req.body.subject || 'Password Reset',
          text: emailText,
        });
        res.sendStatus(200);

      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Unable to send e-mail' });
  }
};

const checkTokenValidity = (req, res, User) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpiration: { $gt: Date.now() }
    },
    (err, user) => {
      if (!user) {
        const message = 'Password reset token is invalid or has expired.';
        console.error(err);
        return res.status(400).json({ message });
      }

      res.status(200).json({ message: 'Password reset token is valid', user: user.email });
    });
};

const validateForgotRequestBody = (req, res, next) => {
  if (req.body.hasOwnProperty('userEmail')) {
    next();
  } else {
    return res.status(400).json({
      message: 'Missing userEmail in request body'
    })
  }
};

const validateResetPasswordBody = (req, res, next) => {
  if (req.body.hasOwnProperty('token') && req.body.hasOwnProperty('password')) {
    next();
  } else {
    return res.status(400).json({
      message: 'Invalid request body'
    })
  }
};

const resetPassword = (req, res, User) => {
  User.findOne(
    {
      resetPasswordToken: req.body.token,
      resetPasswordExpiration: { $gt: Date.now() }
    },
    async (err, user) => {
      if (!user) {
        const message = 'Password reset token is invalid or has expired.';
        console.error(message);
        return res.status(400).json({ message });
      }

      const errorMessage = 'Error setting new user password';
      try {
        await user.setPassword(req.body.password);
        user.resetPasswordExpiration = Date.now();
        await user.save(saveError => {
          if (saveError) {
            console.error(errorMessage);
            return res.status(500).json({ message: errorMessage });
          }

          return res.status(200).json({ message: 'Password successfully reset' });
        });
      } catch (e) {
        return res.status(500).json({ message: errorMessage });
      }
    })
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

const smtpEmailHandler = (req, res, next, emailConfig) => {
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export default passwordResetRoutes;
