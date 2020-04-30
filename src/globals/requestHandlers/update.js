const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { update } = require('../operations');

const updateHandler = (Model, config) => async (req, res) => {
  try {
    const { slug } = config;

    const result = await update({
      req,
      Model,
      config,
      slug,
      depth: req.query.depth,
    });

    return res.status(httpStatus.OK).json({ message: 'Global saved successfully.', result });
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = updateHandler;
