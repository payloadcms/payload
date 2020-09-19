const httpStatus = require('http-status');
const { APIError } = require('../../errors');

async function verifyEmail(args) {
  if (!Object.prototype.hasOwnProperty.call(args, 'token')) {
    throw new APIError('Missing required data.', httpStatus.BAD_REQUEST);
  }

  // /////////////////////////////////////
  // 2. Perform password reset
  // /////////////////////////////////////

  // TODO: How do we know which collection this is?
  const user = await args.collection.Model.findOne({
    _verificationToken: args.token,
  });

  if (!user) throw new APIError('User not found.', httpStatus.BAD_REQUEST);

  user._verified = true;
  user._verificationToken = null;

  await user.save();
}

module.exports = verifyEmail;
