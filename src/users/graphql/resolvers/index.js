const login = require('./login');
const me = require('./me');
const refresh = require('./refresh');
const register = require('./register');
const init = require('./init');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');

module.exports = {
  login,
  me,
  refresh,
  init,
  register,
  forgotPassword,
  resetPassword,
};
