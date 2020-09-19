function sendVerificationEmail(args) {
  // Verify token from e-mail
  const {
    config,
    sendEmail,
    collection: {
      config: collectionConfig,
    },
    user,
    disableEmail,
    req,
  } = args;

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

    sendEmail({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: user.email,
      subject: 'Verify Email',
      html,
    });
  }
}

module.exports = sendVerificationEmail;
