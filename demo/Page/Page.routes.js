import express from 'express';
import { query, create, find, destroy, update } from '../../src/requestHandlers';
import pagePolicy from './Page.policy';

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('')
  .get(pagePolicy.query, query)
  .post(pagePolicy.create, create);

router
  .route('/:id')
  .get(pagePolicy.find, find)
  .put(pagePolicy.update, update)
  .delete(pagePolicy.destroy, destroy);

export default router;
