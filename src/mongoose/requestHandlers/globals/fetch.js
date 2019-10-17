import httpStatus from 'http-status';
import { findOne } from '../../resolvers';
import { createAutopopulateOptions } from '../../createAutopopulateOptions';

const fetch = (req, res) => {
  const query = {
    Model: req.model,
    locale: req.locale,
    fallback: req.query['fallback-locale'],
    depth: req.query.depth
  };

  findOne(query, createAutopopulateOptions(query))
    .then(doc => {
      if (doc[req.params.key]) {
        return res.json(doc[req.params.key]);
      } else if (req.params.key) {
        return res.status(httpStatus.NOT_FOUND)
          .json({error:'not found'});
      }
      return res.json(doc);
    })
    .catch(err => res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err }));
};

export default fetch;
