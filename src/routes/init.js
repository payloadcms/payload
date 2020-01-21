const express = require('express');

const router = express.Router();
const initRoutes = (User) => {
  router
    .route('/init')
    .get((req, res) => {
      User.countDocuments({}, (err, count) => {
        if (err) res.status(200).json({ error: err });
        return count >= 1
          ? res.status(200).json({ initialized: true })
          : res.status(200).json({ initialized: false });
      });
    });

  return router;
};

module.exports = initRoutes;
