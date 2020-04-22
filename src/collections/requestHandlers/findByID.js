const httpStatus = require('http-status');
const { findByID } = require('../operations');
const formatErrorResponse = require('../../express/responses/formatError');

const findByIDHandler = async (req, res) => {
  const options = {
    req,
    Model: req.Model,
    config: req.collection,
    id: req.params.id,
    depth: req.query.depth,
  };

  try {
    const doc = await findByID(options);
    return res.json(doc);
  } catch (err) {
    return res.status(err.status || httpStatus.INTERNAL_SERVER_ERROR).json(formatErrorResponse(err));
  }
};

module.exports = findByIDHandler;
