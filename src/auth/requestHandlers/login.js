const httpStatus = require('http-status');
const { login } = require('../operations');

const loginHandler = (config) => async (req, res, next) => {
  try {
    const token = await login({
      req,
      res,
      collection: req.collection,
      config,
      data: req.body,
    });

    return res.status(httpStatus.OK)
      .json({
        message: 'Auth Passed',
        token,
      });
  } catch (error) {
    return next(error);
  }
};

module.exports = loginHandler;
