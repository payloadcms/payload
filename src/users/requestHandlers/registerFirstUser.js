const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { registerFirstUser } = require('../operations');

const registerFirstUserHandler = async (req, res) => {
  try {
    const firstUser = await registerFirstUser({
      Model: req.Model,
      config: req.collection,
      api: 'REST',
      data: req.body,
    });

    return res.status(201).json(firstUser);
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = registerFirstUserHandler;
