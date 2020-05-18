const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { register } = require('../operations');

const registerHandler = config => async (req, res) => {
  try {
    const user = await register({
      config,
      collection: req.collection,
      req,
      data: req.body,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(error.status || httpStatus.UNAUTHORIZED).json(formatErrorResponse(error));
  }
};

module.exports = registerHandler;
