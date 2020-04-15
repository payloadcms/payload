const passport = require('passport');
const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');

/**
   * Returns User when succesfully registered
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
const register = (User, config) => async (req, res) => {
  try {
    const usernameField = config.user.auth.useAsUsername;

    const user = await User.register(new User({
      [usernameField]: req.body[usernameField],
    }), req.body.password);

    await passport.authenticate('local');

    return res.status(httpStatus.CREATED).json({
      [usernameField]: user[usernameField],
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json(formatErrorResponse(error));
  }
};

module.exports = register;
