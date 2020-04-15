/**
 * Middleware to check if there are any users present in the database.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const checkIfInitialized = User => (req, res, next) => {
  User.countDocuments({}, (err, count) => {
    if (err) res.status(500).json({ error: err });
    if (count >= 1) return res.status(403).json({ initialized: true });
    return next();
  });
};

module.exports = checkIfInitialized;
