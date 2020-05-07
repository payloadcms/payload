const httpStatus = require('http-status');
const { find } = require('../operations');

const findHandler = async (req, res, next) => {
  try {
    const options = {
      req,
      Model: req.collection.Model,
      config: req.collection.config,
      where: req.query.where,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      depth: req.query.depth,
    };

    const result = await find(options);

    // throw new Error('testing error handler');

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
    // return res.status(400).json(err);
  }
};

module.exports = findHandler;
