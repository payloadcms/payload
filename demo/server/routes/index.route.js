const express = require('express');
const pageRoutes = require('./page/page.route');

const router = express.Router({}); // eslint-disable-line new-cap

router.use('/pages', pageRoutes);

module.exports = router;
