import express from 'express';
import userController from './User.controller';
import userValidate from './User.validate';

const userRoutes = express.Router(); // eslint-disable-line new-cap

userRoutes
  .route('') // TODO: not sure how to incorporate url params like `:pageId`
  .post(userValidate.post, userController.post);

export { userRoutes };
