const httpStatus = require('http-status');

const errorHandler = config => (err, req, res, next) => {
  let response;
  if (config.errorHandler) {
    response = config.errorHandler(err);
  } else {
    const data = {};

    // TODO: use payload logging
    console.error(err.stack);

    res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR);

    if (config.debug && config.debug === true) {
      data.stack = err.stack;
    }
    response = {
      ...data,
      error: err.message,
    };
  }
  res.send(response);
};

module.exports = errorHandler;
