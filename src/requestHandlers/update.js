import httpStatus from 'http-status';

const update = (req, res) => {
  req.model.setDefaultLanguage(req.locale);
  req.model.findOne({ _id: req.params._id }, '', {}, (err, doc) => {
    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    Object.keys(req.body).forEach(e => {
      doc[e] = req.body[e];
    });

    doc.save((err) => {
      if (err)
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

      return res.json({
        message: 'success',
        result: doc.toJSON({ virtuals: true })
      });
    });
  });
};

export default update;
