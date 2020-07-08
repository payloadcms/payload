const login = require('./login');
const refresh = require('./refresh');
const register = require('./register');
const init = require('./init');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');
const registerFirstUser = require('./registerFirstUser');
const update = require('./update');
const access = require('./access');
const me = require('./me');

module.exports = {
  login,
  refresh,
  init,
  register,
  forgotPassword,
  update,
  resetPassword,
  registerFirstUser,
  access,
  me,
};
