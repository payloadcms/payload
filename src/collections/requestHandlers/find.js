const httpStatus = require('http-status');
const { find } = require('../queries');

const findHandler = async (req, res) => {
  try {
    const options = {
      model: req.model,
      query: {},
      paginate: {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort,
      },
      depth: req.query.depth,
      locale: req.locale,
      fallbackLocale: req.query['fallback-locale'],
    };

    if (req.query.where) options.query.where = req.query.where;

    const result = await find(options);

    return res.status(httpStatus.OK).json(result);
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = findHandler;
