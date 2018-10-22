const express = require('express');
const pageController = require('./Page.controller');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('') // TODO: not sure how to incorporate url params like `:pageId`
  .get(pageController.get)
  .post(pageController.post);

module.exports = router;
