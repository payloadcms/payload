import httpStatus from 'http-status';

const query = (req, res) => {

  req.model.paginate(req.model.apiQuery(req.find, req.locale), req.find, (err, result) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
    }
    return res.json({
      ...result,
      docs: result.docs.map(doc => {
        if (req.locale) {
          doc.setLocale(req.locale, req.find['fallback-locale']);
        }

        return doc.toJSON({ virtuals: true })
      })
    });
  })
};

export default query;
