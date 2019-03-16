import httpStatus from 'http-status';

const query = (req, res) => {
  req.model.apiQuery(req.query, req.locale, (err, result) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
    }
    return res.json(
      result.map(doc => { //TODO: 'result.docs' will need to be used for the pagination plugin
        if (req.locale) {
          doc.setLocale(req.locale, req.query['fallback-locale']);
        }

        return doc.toJSON({ virtuals: true })
      })
    );
  });
};

export default query;
