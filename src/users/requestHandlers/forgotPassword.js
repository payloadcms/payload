const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

  return nodemailer.createTransport(smtpOptions);
};

const forgotPassword = (User, config) => async (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(req.body, 'userEmail')) {
    return res.status(400).json({ message: 'Missing userEmail in request body' });
  }

  const emailHandler = config.email.provider === 'smtp'
    ? nodemailer.createTransport(config.email)
    : await mockEmailHandler(config.email);

  try {
    let token = await crypto.randomBytes(20);
    token = token.toString('hex');

    const user = await User.findOne({ email: req.body.userEmail });

    if (!user) {
      return res.status(400).json({ message: `No account with email ${req.body.userEmail} address exists.` });
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpiration = Date.now() + 3600000; // 1 hour

    await user.save();

    console.log('Temporary reset token created and saved to DB');

    const emailText = `You are receiving this because you (or someone else) have requested the reset of the password for your account.
                       Please click on the following link, or paste this into your browser to complete the process:
                       ${req.protocol}://${req.headers.host}/reset/${token}
                       If you did not request this, please ignore this email and your password will remain unchanged.`;

    emailHandler.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: req.body.userEmail,
      subject: req.body.subject || 'Password Reset',
      text: emailText,
    });

    return res.sendStatus(200);
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Unable to send e-mail' });
  }
};

module.exports = forgotPassword;
