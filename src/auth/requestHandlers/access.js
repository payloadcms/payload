const httpStatus = require('http-status');
const { access } = require('../operations');

const policiesHandler = config => async (req, res, next) => {
  try {
    const policyResults = await access({
      req,
      config,
    });

    return res.status(httpStatus.OK)
      .json(policyResults);
  } catch (error) {
    return next(error);
  }
};

module.exports = policiesHandler;
