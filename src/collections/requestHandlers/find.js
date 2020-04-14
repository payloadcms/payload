const httpStatus = require('http-status');
const { find } = require('../operations');

const findHandler = async (req, res) => {
  try {
    const options = {
      Model: req.Model,
      config: req.collection,
      where: req.query.where,
      locale: req.locale,
      fallbackLocale: req.fallbackLocale,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      depth: req.query.depth,
      user: req.user,
      api: 'REST',
    };

    const result = await find(options);

    return res.status(httpStatus.OK).json(result);
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = findHandler;
