const httpStatus = require('http-status');
const { NotFound } = require('../errors');
const formatErrorResponse = require('../express/responses/formatError');

const upsert = (req, res) => {
  const { slug } = req.global;

  req.model.findOne({ globalType: slug }, (findErr, doc) => {
    if (!doc) {
      return req.model.create({
        ...req.body,
        globalType: slug,
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
  const { slug } = req.global;

  const options = {};

  if (req.query.depth) {
    options.autopopulate = {
      maxDepth: req.query.depth,
    };
  }

  req.model.findOne({ globalType: slug }, null, options, (findErr, doc) => {
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

module.exports = {
  findOne,
  upsert,
};
