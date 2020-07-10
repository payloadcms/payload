const httpStatus = require('http-status');
const { access } = require('../operations');

const policiesHandler = (config) => async (req, res, next) => {
  try {
    const accessResults = await access({
      req,
      config,
    });

    return res.status(httpStatus.OK)
      .json(accessResults);
  } catch (error) {
    return next(error);
  }
};

module.exports = policiesHandler;
