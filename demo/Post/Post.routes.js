import express from 'express';
import {query, create, find} from '../../src/requestHandlers'; // payload implementations

import update from '../shared/requestHandlers/update'; // application implementations
import {destroy} from './Post.requestHandler'; // model specific implementations
import Post from './Post.model';
import postPolicy from './Post.policy';

const router = express.Router(); // eslint-disable-line new-cap

// Set the model on the req for generic request handlers can operate on the model
// Option: Make this its own middleware?
router.all('', (req, res, next) => {
  req.model = Post;
  next();
});

router
  .route('')
  .get(postPolicy.query, query)
  .post(postPolicy.post, create);

router
  .route('/:id')
  .get(postPolicy.find, find)
  .put(postPolicy.update, update)
  .delete(postPolicy.delete, destroy);

export default router;
