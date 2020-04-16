const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { registerFirstUser } = require('../operations');

const registerFirstUserHandler = (User, config) => async (req, res) => {
  try {
    const firstUser = await registerFirstUser({
      Model: User,
      config,
      api: 'REST',
      data: req.body,
    });

    return res.status(201).json(firstUser);
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = registerFirstUserHandler;
