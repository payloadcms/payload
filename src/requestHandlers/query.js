import httpStatus from 'http-status';

const query = (req, res) => {
  if (req.query.locale)
    req.model.setDefaultLanguage(req.query.locale);

  req.model.apiQuery(req.query, (err, pages) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

    return res.json(pages.map(page => page.toJSON({ virtuals: !!req.locale })));
  });
};

export default query;
