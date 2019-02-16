import httpStatus from 'http-status';

const query = (req, res) => {
  if (req.query.locale) {
    req.model.setDefaultLanguage(req.query.locale);
  }

  req.model.paginate(req.model.apiQuery(req.query), req.query, (err, result) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
    }

    return res.json({
      ...result,
      docs: result.docs.map(doc => doc.toJSON({ virtuals: !!req.locale }))
    });
  })
};

export default query;
