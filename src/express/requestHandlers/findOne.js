const httpStatus = require('http-status');
const { modelById } = require('../../mongoose/queries');
const formatErrorResponse = require('../../responses/formatError');

const findOne = (req, res) => {
  const query = {
    Model: req.model,
    id: req.params.id,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  modelById(query)
    .then(doc => res.json(doc))
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose')));
};

module.exports = findOne;
