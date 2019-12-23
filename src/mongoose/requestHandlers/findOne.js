import { modelById } from '../resolvers';
import { createAutopopulateOptions } from '../createAutopopulateOptions';

const findOne = (req, res) => {
  const query = {
    Model: req.model,
    id: req.params.id,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth,
  };

  modelById(query, createAutopopulateOptions(query))
    .then(doc => res.json(doc))
    .catch(err => res.status(err.status).json({ error: err }));
};

export default findOne;
