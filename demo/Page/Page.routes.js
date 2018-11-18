const express = require('express');
const pageController = require('./Page.controller');
const pagePolicy = require('./Page.policy');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('') // TODO: not sure how to incorporate url params like `:pageId`
  .all(pagePolicy.all)
  .get(pagePolicy.get, pageController.get)
  .post(pagePolicy.post, pageController.post);

module.exports = router;
