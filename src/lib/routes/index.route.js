const express = require('express');
const authRoutes = require('./auth/auth.route');

const router = express.Router({}); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));
router.use('', authRoutes);

module.exports = router;
