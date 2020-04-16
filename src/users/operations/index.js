const login = require('./login');
const refresh = require('./refresh');
const register = require('./register');
const init = require('./init');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');
const registerFirstUser = require('./registerFirstUser');

module.exports = {
  login,
  refresh,
  init,
  register,
  forgotPassword,
  resetPassword,
  registerFirstUser,
};
