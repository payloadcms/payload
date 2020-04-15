const express = require('express');
const passport = require('passport/lib');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

const passwordResetRoutes = (emailConfig, User) => {
  const mockEmailHandler = async () => {
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

    return nodemailer.createTransport(smtpOptions);
  };


  const sendResetEmail = async (req, res, next) => {
    let emailHandler;

    try {
      switch (emailConfig.provider) {
        case 'mock':
          emailHandler = await mockEmailHandler();
          break;
        case 'smtp':
          emailHandler = nodemailer.createTransport(emailConfig);
          break;
        default:
          emailHandler = await mockEmailHandler(req, res, next, emailConfig);
      }

      const generateToken = () => new Promise(resolve => crypto.randomBytes(20, (err, buffer) => resolve(buffer.toString('hex'))));

      const token = await generateToken();

      User.findOne({ email: req.body.userEmail }, (err, user) => {
        if (!user) {
          const message = `No account with email ${req.body.userEmail} address exists.`;
          return res.status(400).json({ message });
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

  const validateForgotRequestBody = (req, res, next) => {
    if (Object.prototype.hasOwnProperty.call(req.body, 'userEmail')) {
      next();
    } else {
      return res.status(400).json({
        message: 'Missing userEmail in request body',
      });
    }
  };

  const validateResetPasswordBody = (req, res, next) => {
    if (Object.prototype.hasOwnProperty.call(req.body, 'token') && Object.prototype.hasOwnProperty.call(req.body, 'password')) {
      next();
    } else {
      return res.status(400).json({
        message: 'Invalid request body',
      });
    }
  };

  const resetPassword = (req, res) => {
    User.findOne(
      {
        resetPasswordToken: req.body.token,
        resetPasswordExpiration: { $gt: Date.now() },
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
          await user.save((saveError) => {
            if (saveError) {
              console.error(errorMessage);
              return res.status(500).json({ message: errorMessage });
            }

            return res.status(200).json({ message: 'Password successfully reset' });
          });
        } catch (e) {
          return res.status(500).json({ message: errorMessage });
        }
      },
    );
  };

  router
    .route('/forgot')
    .post(
      passport.authenticate('jwt', { session: false }),
      validateForgotRequestBody,
      sendResetEmail,
    );

  router
    .route('/reset')
    .post(
      (req, res, next) => validateResetPasswordBody(req, res, next),
      (req, res) => resetPassword(req, res, User),
    );

  return router;
};

module.exports = passwordResetRoutes;
