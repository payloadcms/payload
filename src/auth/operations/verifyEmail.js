const httpStatus = require('http-status');
const { APIError } = require('../../errors');

async function verifyEmail(args) {
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // 2. Perform password reset
  // /////////////////////////////////////

  const user = await args.collection.Model.findOne({
    _verificationToken: args.token,
  });

  if (!user) throw new APIError('Verification token is invalid.', httpStatus.BAD_REQUEST);
  if (user && user._verified === true) throw new APIError('This account has already been activated.', httpStatus.ACCEPTED);

  user._verified = true;
  user._verificationToken = undefined;

  await user.save();
  return true;
}

module.exports = verifyEmail;
