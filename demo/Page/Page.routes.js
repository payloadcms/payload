const express = require('express');
const pageController = require('./Page.controller');
const pagePolicy = require('./Page.policy');

const router = express.Router(); // eslint-disable-line new-cap

router
  .route('')
  .all(pagePolicy.all)
  .get(pagePolicy.query, pageController.query)
  .post(pagePolicy.post, pageController.post);

router
  .route('/:id')
  .get(pagePolicy.find, pageController.find)
  .put(pagePolicy.update, pageController.update)
  .delete(pagePolicy.delete, pageController.delete);



module.exports = router;
