const { findByID } = require('../operations');

const findByIDHandler = async (req, res, next) => {
  const options = {
    req,
    Model: req.collection.Model,
    config: req.collection.config,
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
