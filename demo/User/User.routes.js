const express = require('express');
const userController = require('./User.controller');
const userValidate = require('./User.validate');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('') // TODO: not sure how to incorporate url params like `:pageId`
  .post(userValidate.post, userController.post);

module.exports = router;
