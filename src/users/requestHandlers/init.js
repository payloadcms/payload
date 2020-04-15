const init = User => (req, res) => {
  User.countDocuments({}, (err, count) => {
    if (err) res.status(200).json({ error: err });
    return count >= 1
      ? res.status(200).json({ initialized: true })
      : res.status(200).json({ initialized: false });
  });
};

module.exports = init;
