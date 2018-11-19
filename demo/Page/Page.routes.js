const express = require('express');
const pageController = require('./Page.controller');
const pagePolicy = require('./Page.policy');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('')
  .all(pagePolicy.all)
  .get(pagePolicy.get, pageController.get)
  .post(pagePolicy.post, pageController.post);

router
  .route('/:id')
  .get(pagePolicy.getById, pageController.getById);



module.exports = router;
