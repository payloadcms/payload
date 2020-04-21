const httpStatus = require('http-status');
const { findByID } = require('../operations');
const formatErrorResponse = require('../../express/responses/formatError');

const findByIDHandler = async (req, res) => {
  const options = {
    req,
    Model: req.Model,
    config: req.collection,
    user: req.user,
    id: req.params.id,
    locale: req.locale,
    fallbackLocale: req.fallbackLocale,
    depth: req.query.depth,
    api: 'REST',
  };

  try {
    const doc = await findByID(options);
    return res.json(doc);
  } catch (err) {
    return res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err));
  }
};

module.exports = findByIDHandler;
