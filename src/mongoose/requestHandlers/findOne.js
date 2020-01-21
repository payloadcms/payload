const { modelById } = require('../resolvers');

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
    .catch(err => res.status(err.status).json({ err }));
};

module.exports = findOne;
