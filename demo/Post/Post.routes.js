import express from 'express';
import postPolicy from './Post.policy';
import Post from './Post.model';
import requestHandler from '../../src/requestHandlers';

const router = express.Router(); // eslint-disable-line new-cap

// Set the model on the req for generic request handlers can operate on the model
// Option: Make this its own middleware?
router.all('', (req, res, next) => {
  req.model = Post;
  next();
});

router
  .route('')
  .get(postPolicy.query, requestHandler.query)
  .post(postPolicy.post, requestHandler.post);

router
  .route('/:id')
  .get(postPolicy.find, requestHandler.find)
  .put(postPolicy.update, requestHandler.update)
  .delete(postPolicy.delete, requestHandler.delete);

export default router;
