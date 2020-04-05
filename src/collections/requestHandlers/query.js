const httpStatus = require('http-status');

const query = async (req, res) => {
  try {
    const mongooseQuery = await req.model.buildQuery(req.query, req.locale);

    const paginateQuery = {
      options: {},
    };

    if (req.query.page) paginateQuery.page = req.query.page;
    if (req.query.limit) paginateQuery.limit = req.query.limit;
    if (req.query.sort) paginateQuery.sort = req.query.sort;

    if (req.query.depth) {
      paginateQuery.options.autopopulate = {
        maxDepth: req.query.depth,
      };
    }

    const result = await req.model.paginate(mongooseQuery, paginateQuery);

    return res.status(httpStatus.OK).json({
      ...result,
      docs: result.docs.map((doc) => {
        if (req.locale && doc.setLocale) {
          doc.setLocale(req.locale, req.query['fallback-locale']);
        }

        return doc.toJSON({ virtuals: true });
      }),
    });
  } catch (err) {
    return res.status(400).json(err);
  }
};

module.exports = query;
