const httpStatus = require('http-status');
const { findOne } = require('../mongoose/resolvers');
const { NotFound } = require('../errors');

const upsert = (req, res) => {
  if (!req.model.schema.tree[req.params.slug]) {
    res.status(httpStatus.NOT_FOUND).json(new NotFound());
    return;
  }

  req.model.findOne({}, (findErr, doc) => {
    let global = {};
    if (!doc) {
      if (req.params.slug) {
        global[req.params.slug] = req.body;
      } else {
        global = req.body;
      }

      return req.model.create(global, (createErr, result) => {
        if (createErr) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: createErr });

        return res.status(httpStatus.CREATED)
          .json({
            message: 'success',
            result: result.toJSON({ virtuals: true }),
          });
      });
    }

    if (!doc[req.params.slug]) {
      Object.assign(doc[req.params.slug], {});
    }

    Object.assign(doc[req.params.slug], req.body);

    return doc.save((err) => {
      if (err) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err });

      return res.json({
        message: 'success',
        result: doc.toJSON({ virtuals: true }),
      });
    });
  });
};

const fetch = (req, res) => {
  const query = {
    Model: req.model,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  findOne(query)
    .then((doc) => {
      const globals = { ...doc };

      if (globals[req.params.key]) {
        return res.json(globals[req.params.key]);
      } if (req.params.key) {
        return res.status(httpStatus.NOT_FOUND).json(new NotFound());
      }
      return res.json(globals);
    })
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err }));
};

module.exports = {
  fetch,
  upsert,
};
