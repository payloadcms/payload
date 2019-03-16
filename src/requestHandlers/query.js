import httpStatus from 'http-status';

const query = (req, res) => {
  console.log('inside query');

  req.model.apiQuery(req.query, (err, result) => {
    if (err) {
      console.log('api query error', err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });
    }
    console.log('no error inside api query');
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
