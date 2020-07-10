const { findByID } = require('../operations');

const findByIDHandler = (config) => async (req, res, next) => {
  const options = {
    req,
    collection: req.collection,
    config,
    id: req.params.id,
    depth: req.query.depth,
  };

  try {
    const doc = await findByID(options);
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
};

module.exports = findByIDHandler;
