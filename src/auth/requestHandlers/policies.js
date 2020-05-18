const httpStatus = require('http-status');
const formatErrorResponse = require('../../express/responses/formatError');
const { policies } = require('../operations');

const policiesHandler = config => async (req, res) => {
  try {
    const policyResults = await policies({
      req,
      config,
      collection: req.collection,
    });

    return res.status(httpStatus.OK)
      .json(policyResults);
  } catch (error) {
    return res.status(error.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(error));
  }
};

module.exports = policiesHandler;
