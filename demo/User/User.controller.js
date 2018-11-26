const User = require('./User.model');
const user = require('../../src/user')(User);

const userController = {
  post: user.post,
};

module.exports = userController;
