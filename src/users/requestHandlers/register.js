const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { register } = require('../operations');

const registerHandler = async (req, res) => {
  try {
    const user = await register({
      data: req.body,
      Model: req.Model,
      config: req.collection,
      api: 'REST',
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json(formatErrorResponse(error));
  }
};

module.exports = registerHandler;
