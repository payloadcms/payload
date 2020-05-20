const errorHandler = async (info, debug, afterErrorHook) => {
  return Promise.all(info.result.errors.map(async (err) => {
    // TODO: use payload logging
    console.error(err.stack);

    let response = {
      ...err,
    };

    if (afterErrorHook) {
      ({ response } = await afterErrorHook(err, response) || { response });
    }

    if (debug && debug === true) {
      response.stack = err.stack;
    }

    return response;
  }));
};

module.exports = errorHandler;
