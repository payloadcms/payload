const httpStatus = require('http-status');
const { modelById } = require('../queries');
const formatErrorResponse = require('../../responses/formatError');

const findOne = async (req, res) => {
  const query = {
    Model: req.model,
    id: req.params.id,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  try {
    const doc = await modelById(query);
    return res.json(doc);
  } catch (err) {
    console.log(err);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err, 'mongoose'));
  }
};

module.exports = findOne;
