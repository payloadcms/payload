const httpStatus = require('http-status');
const { NotFound } = require('../errors');
const formatErrorResponse = require('../responses/formatError');

const upsert = (req, res) => {
  req.model.findOne({ globalType: req.params.slug }, (findErr, doc) => {
    if (!doc) {
      return req.model.create({
        ...req.body,
        globalType: req.params.slug,
      }, (createErr, result) => {
        if (createErr) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(createErr, 'mongoose'));

        return res.status(httpStatus.CREATED)
          .json({
            message: 'success',
            result: result.toJSON({ virtuals: true }),
          });
      });
    }

    if (req.query.locale && doc.setLocale) {
      doc.setLocale(req.query.locale, req.query['fallback-locale']);
    }

    Object.assign(doc, req.body);

    return doc.save((err) => {
      if (err) return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));

      return res.json({
        message: 'Saved successfully.',
        doc: doc.toJSON({ virtuals: true }),
      });
    });
  });
};

const findOne = (req, res) => {
  const options = {};

  if (req.query.depth) {
    options.autopopulate = {
      maxDepth: req.query.depth,
    };
  }

  req.model.findOne({ globalType: req.params.slug }, null, options, (findErr, doc) => {
    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));
    }

    let result = doc;

    if (req.query.locale && doc.setLocale) {
      doc.setLocale(req.query.locale, req.query['fallback-locale']);
      result = doc.toJSON({ virtuals: true });
    }

    return res.status(httpStatus.OK).json(result);
  });
};

const findAll = (req, res) => {
  const options = {
    locale: req.locale,
    fallback: req.query['fallback-locale'],
  };

  if (req.query.depth) {
    options.autopopulate = {
      maxDepth: req.query.depth,
    };
  }

  req.model.findOne({ globalType: req.params.slug }, null, options, (findErr, doc) => {
    if (!doc) {
      return res.status(httpStatus.NOT_FOUND).json(formatErrorResponse(new NotFound(), 'APIError'));
    }

    return res.status(httpStatus.OK).json(doc.toJSON({ virtuals: true }));
  });
};

module.exports = {
  findAll,
  findOne,
  upsert,
};
