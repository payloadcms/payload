import httpStatus from 'http-status';

const query = (req, res) => {
  if (req.query.locale)
    req.model.setDefaultLanguage(req.query.locale);

  req.model.apiQuery(req.query, (err, pages) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

    return res.json(pages.map(page => page.toJSON({virtuals: !!req.locale})));
  });
};

const find = (req, res) => {
  req.model.findById(req.params.id, (err, doc) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    if (req.locale) {
      doc.setLanguage(req.locale);
      return res.json(doc.toJSON({virtuals: true}));
    }

    return res.json(doc);
  });
};

const create = (req, res) => {
  req.model.setDefaultLanguage(req.locale);
  req.model.create(req.body, (err, result) => {
    if (err)
      return res.send(httpStatus.INTERNAL_SERVER_ERROR, {error: err});

    return res.status(httpStatus.CREATED)
      .json({
        message: 'success',
        result: result.toJSON({virtuals: true})
      });
  });
};

const update = (req, res) => {
  req.model.setDefaultLanguage(req.locale);
  req.model.findOne({_id: req.params.id}, '', {}, (err, doc) => {
    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    Object.keys(req.body).forEach(e => {
      doc[e] = req.body[e];
    });

    doc.save((err) => {
      if (err)
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

      return res.json({
        message: 'success',
        result: doc.toJSON({virtuals: true})
      });
    });
  });
};

const destroy = (req, res) => {
  req.model.findOneAndDelete({_id: req.params.id}, (err, doc) => {
    if (err)
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({error: err});

    if (!doc)
      return res.status(httpStatus.NOT_FOUND).send('Not Found');

    return res.send();
  });
};

export {query, find, create, update, destroy};
