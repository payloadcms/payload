const httpStatus = require('http-status');
const { findByID } = require('../queries');
const formatErrorResponse = require('../../responses/formatError');

const findByIDHandler = async (req, res) => {
  const query = {
    Model: req.model,
    id: req.params.id,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  try {
    const doc = await findByID(query);
    return res.json(doc);
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));
  }
};

module.exports = findByIDHandler;
