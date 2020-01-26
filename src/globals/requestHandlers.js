const httpStatus = require('http-status');
const { findOne } = require('../mongoose/resolvers');
const { NotFound } = require('../errors');
const formatErrorResponse = require('../responses/formatError');

const upsert = (req, res) => {
  if (!req.model.schema.tree[req.params.slug]) {
    return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));
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
        if (createErr) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(createErr, 'mongoose'));

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
      if (err) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));

      return res.json({
        message: 'Saved successfully.',
        doc: doc.toJSON({ virtuals: true }),
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
      if (doc[req.params.slug]) {
        return res.json(doc[req.params.slug]);
      } if (req.params.slug) {
        return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));
      }
      return res.json(doc);
    })
    .catch((err) => {
      return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(err, 'APIError'));
    });
};

module.exports = {
  fetch,
  upsert,
};
