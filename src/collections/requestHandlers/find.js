const httpStatus = require('http-status');
const { find } = require('../operations');

const findHandler = async (req, res) => {
  try {
    const options = {
      req,
      Model: req.Model,
      config: req.collection,
      where: req.query.where,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      depth: req.query.depth,
    };

    const result = await find(options);

    return res.status(httpStatus.OK).json(result);
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = findHandler;
