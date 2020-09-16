async function sendVerificationEmail(args) {
  const { config, sendEmail: email } = this;

  const options = { ...args };

  // Verify token from e-mail
  const {
    collection: {
      config: collectionConfig,
    },
    user,
    data,
    disableEmail,
    req,
  } = options;

  if (!disableEmail) {
    const url = collectionConfig.auth.generateVerificationUrl
      ? `${config.serverURL}${collectionConfig.auth.generateVerificationUrl(req, user.verificationToken)}`
      : 'asdfasdf'; // TODO: point to payload view that verifies
    const html = `Thank you for created an account.
    Please click on the following link, or paste this into your browser to complete the process:
    <a href="${url}">
    ${url}
    </a>
    If you did not request this, please ignore this email and your password will remain unchanged.`;

    email({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: data.email,
      subject: 'Verify Email',
      html,
    });
  }
}

module.exports = sendVerificationEmail;
