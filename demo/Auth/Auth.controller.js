const User = require('../User/User.model');
const auth = require('../../src/auth')(User);

const authController = {
  login: auth.login,
  register: auth.register,
  me: auth.me,
  check: auth.check
}

module.exports = authController;
