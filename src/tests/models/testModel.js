module.exports = payload => {
  const route = '/api/testmodel';

  payload.express.get(route, (req, res) => {
    res.sendStatus(200);
  });

  payload.express.post(route, (req, res) => {
    res.sendStatus(201);
  });
};
