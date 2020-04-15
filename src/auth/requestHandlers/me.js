/**
   * Returns User if user session is still open
   * @param req
   * @param res
   * @returns {*}
   */
const me = (req, res) => {
  return res.status(200).send(req.user);
};

module.exports = me;
