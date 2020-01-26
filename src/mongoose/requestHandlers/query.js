const httpStatus = require('http-status');
const formatErrorResponse = require('../../responses/formatError');

const query = (req, res) => {
  const queryOptions = {};

  if (req.query.depth) {
    queryOptions.autopopulate = {
      maxDepth: req.query.depth,
    };
  }

  req.model.paginate(req.model.apiQuery(req.query, req.locale), { options: queryOptions }, (err, result) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));
    }
    res.status(httpStatus.OK).json({
      ...result,
      docs: result.docs.map((doc) => {
        if (req.locale && doc.setLocale) {
          doc.setLocale(req.locale, req.query['fallback-locale']);
        }

        return doc.toJSON({ virtuals: true });
      }),
    });
  });
};

module.exports = query;
