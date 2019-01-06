import express from 'express';
import passport from 'passport';
import pageController from './Page.controller';
import pagePolicy from './Page.policy';

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('')
  .get(pagePolicy.query, pageController.query)
  .post(pagePolicy.post, pageController.post);

router
  .route('/:slug')
  .get(pagePolicy.find, pageController.find)
  .put(pagePolicy.update, pageController.update)
  .delete(pagePolicy.delete, pageController.delete);

export default router;
