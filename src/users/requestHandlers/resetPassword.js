const formatError = require('../../express/responses/formatError');

const resetPassword = User => async (req, res) => {
  try {
    if (!Object.prototype.hasOwnProperty.call(req.body, 'token')
      || !Object.prototype.hasOwnProperty.call(req.body, 'password')) {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const user = await User.findOne({
      resetPasswordToken: req.body.token,
      resetPasswordExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    await user.setPassword(req.body.password);
    user.resetPasswordExpiration = Date.now();

    await user.save();

    return res.status(200).json({ message: 'Password successfully reset' });
  } catch (error) {
    return res.status(500).json(formatError(error));
  }
};

module.exports = resetPassword;
