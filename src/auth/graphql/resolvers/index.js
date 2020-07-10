const login = require('./login');
const me = require('./me');
const refresh = require('./refresh');
const register = require('./register');
const init = require('./init');
const forgotPassword = require('./forgotPassword');
const resetPassword = require('./resetPassword');
const update = require('./update');
const access = require('./access');
const logout = require('./logout');

module.exports = {
  login,
  me,
  refresh,
  init,
  register,
  forgotPassword,
  resetPassword,
  update,
  access,
  logout,
};
