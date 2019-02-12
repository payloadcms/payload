import httpStatus from 'http-status';

const find = (req, res) => {
  req.model.findById(req.params.id, (err, doc) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    if (req.locale) {
      doc.setLanguage(req.locale);
      return res.json(doc.toJSON({ virtuals: true }));
    }

    return res.json(doc);
  });
};

export default find;
