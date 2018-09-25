const express = require('express');
const pageRoutes = require('./page/page.route');

const router = express.Router({}); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

router.use('/pages', pageRoutes);

module.exports = router;
