const httpStatus = require('http-status');
const { find } = require('../operations');

const findHandler = (config) => async (req, res, next) => {
  try {
    const options = {
      req,
      collection: req.collection,
      config,
      where: req.query.where,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      depth: req.query.depth,
    };

    const result = await find(options);

    return res.status(httpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = findHandler;
