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
  .get(pagePolicy.findById, pageController.findById)
  // DR: I considered calling this method postById but that is awkward, though I am concerned that we have a put that is hit using HTTP POST
  .post(pagePolicy.put, pageController.put)
  .delete(pagePolicy.delete, pageController.delete);



module.exports = router;
